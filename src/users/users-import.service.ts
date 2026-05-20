import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';

import type { IUserRepository } from '../domain/ports/user-repository.port';
import type { IStudentRepository } from '../domain/ports/student-and-attendance.ports';
import type {
  IGroupRepository,
  ISectionRepository,
} from '../domain/ports/sections-and-groups.ports';
import {
  GROUP_REPOSITORY,
  SECTION_REPOSITORY,
  STUDENT_REPOSITORY,
  USER_REPOSITORY,
} from '../domain/tokens/injection.tokens';
import { StudentValidator } from '../domain/validators/student.validator';
import { StudentSectionEnrollerDomain } from '../domain/services/student-section-enroller.domain';
import { GroupEnrollerDomain } from '../domain/services/group-enroller.domain';
import { mapCsvHeaders, parseCsv } from './csv-parse.util';

export type ImportRowResult = {
  row: number;
  email: string;
  status: 'created' | 'updated' | 'skipped' | 'error';
  message?: string;
};

export type ImportStudentsResult = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  rows: ImportRowResult[];
};

type ParsedRow = {
  email: string;
  name: string;
  lastname: string;
  idCard: string;
  sectionNumber?: number;
  groupNumber?: number;
  password: string;
};

@Injectable()
export class UsersImportService {
  private readonly studentValidator = new StudentValidator();

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository,
    @Inject(SECTION_REPOSITORY) private readonly sections: ISectionRepository,
    @Inject(GROUP_REPOSITORY) private readonly groups: IGroupRepository,
    private readonly sectionEnroller: StudentSectionEnrollerDomain,
    private readonly groupEnroller: GroupEnrollerDomain,
    private readonly cfg: ConfigService,
  ) {}

  async importStudentsFromCsv(fileBuffer: Buffer): Promise<ImportStudentsResult> {
    const text = fileBuffer.toString('utf8').replace(/^\uFEFF/, '');
    const matrix = parseCsv(text);
    if (matrix.length < 2) {
      throw new BadRequestException('El CSV debe incluir encabezados y al menos una fila');
    }

    const col = mapCsvHeaders(matrix[0]);
    const required = ['email', 'name', 'lastname', 'idCard'] as const;
    for (const key of required) {
      if (col[key] === undefined) {
        throw new BadRequestException(
          `Falta columna requerida: ${key} (email, name, lastname, idCard)`,
        );
      }
    }

    const defaultPassword =
      this.cfg.get<string>('studentImportDefaultPassword') ?? '';

    const rows: ImportRowResult[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const sectionCache = new Map<number, string>();

    for (let i = 1; i < matrix.length; i++) {
      const line = matrix[i];
      const rowNum = i + 1;

      try {
        const parsed = this.parseRow(line, col, defaultPassword);
        if (!parsed) {
          skipped++;
          rows.push({
            row: rowNum,
            email: '',
            status: 'skipped',
            message: 'Fila vacía',
          });
          continue;
        }

        const outcome = await this.upsertStudent(parsed, sectionCache);
        rows.push({ row: rowNum, email: parsed.email, ...outcome });
        if (outcome.status === 'created') created++;
        else if (outcome.status === 'updated') updated++;
        else if (outcome.status === 'skipped') skipped++;
        else errors++;
      } catch (e: unknown) {
        errors++;
        const email = line[col.email] ?? '';
        rows.push({
          row: rowNum,
          email,
          status: 'error',
          message: e instanceof Error ? e.message : 'Error desconocido',
        });
      }
    }

    return {
      total: matrix.length - 1,
      created,
      updated,
      skipped,
      errors,
      rows,
    };
  }

  private parseRow(
    line: string[],
    col: Record<string, number>,
    defaultPassword: string,
  ): ParsedRow | null {
    const email = (line[col.email] ?? '').trim().toLowerCase();
    const name = (line[col.name] ?? '').trim();
    const lastname = (line[col.lastname] ?? '').trim();
    const idCard = (line[col.idCard] ?? '').trim();
    if (!email && !name && !idCard) return null;

    const sectionRaw =
      col.sectionNumber !== undefined ? line[col.sectionNumber]?.trim() : '';
    const groupRaw =
      col.groupNumber !== undefined ? line[col.groupNumber]?.trim() : '';
    const passwordRaw =
      col.password !== undefined ? line[col.password]?.trim() : '';

    const password = passwordRaw || defaultPassword || idCard;
    if (!password || password.length < 8) {
      throw new BadRequestException(
        'Contraseña requerida (columna password o STUDENT_IMPORT_DEFAULT_PASSWORD de al menos 8 caracteres)',
      );
    }

    this.studentValidator.validateStudentCreate({
      email,
      password,
      name,
      lastname,
      idCard,
    });

    const parsed: ParsedRow = { email, name, lastname, idCard, password };
    if (sectionRaw) {
      const sectionNumber = Number(sectionRaw);
      if (!Number.isFinite(sectionNumber) || sectionNumber < 1) {
        throw new BadRequestException('sectionNumber inválido');
      }
      parsed.sectionNumber = sectionNumber;
    }
    if (groupRaw) {
      const groupNumber = Number(groupRaw);
      if (!Number.isFinite(groupNumber) || groupNumber < 1) {
        throw new BadRequestException('groupNumber inválido');
      }
      parsed.groupNumber = groupNumber;
      if (!parsed.sectionNumber) {
        throw new BadRequestException('groupNumber requiere sectionNumber');
      }
    }

    return parsed;
  }

  private async upsertStudent(
    row: ParsedRow,
    sectionCache: Map<number, string>,
  ): Promise<Omit<ImportRowResult, 'row' | 'email'>> {
    const existing = await this.users.findByEmailIncludingPassword(row.email);

    if (!existing) {
      const pwd = await argon2.hash(row.password);
      const user = await this.users.createBareUser({
        email: row.email,
        passwordHash: pwd,
        name: row.name,
        lastname: row.lastname,
      });
      await this.students.createProfile({ userId: user.id, idCard: row.idCard });
      await this.applySectionAndGroup(user.id, row, sectionCache);
      return { status: 'created' };
    }

    const agg = await this.students.findAggregateByUserId(existing.id);
    if (!agg) {
      await this.students.createProfile({ userId: existing.id, idCard: row.idCard });
    }

    await this.users.updateProfile(existing.id, {
      name: row.name,
      lastname: row.lastname,
    });
    if (agg && row.idCard !== agg.idCard) {
      await this.students.updateExtrasByUser(existing.id, { idCard: row.idCard });
    }

    await this.applySectionAndGroup(existing.id, row, sectionCache);
    return { status: 'updated' };
  }

  private async applySectionAndGroup(
    userId: string,
    row: ParsedRow,
    sectionCache: Map<number, string>,
  ) {
    if (row.sectionNumber == null) return;

    let sectionId = sectionCache.get(row.sectionNumber);
    if (!sectionId) {
      const gallery = await this.sections.listGallery();
      const match = gallery.find((s) => s.sectionNumber === row.sectionNumber);
      if (!match) {
        throw new BadRequestException(`Sección ${row.sectionNumber} no existe`);
      }
      sectionId = match.id;
      sectionCache.set(row.sectionNumber, sectionId);
    }

    await this.sectionEnroller.enroll(userId, sectionId, { allowReassign: true });

    if (row.groupNumber == null) return;

    const groups = await this.groups.listActiveForSection(sectionId);
    const group = groups.find((g) => g.number === row.groupNumber);
    if (!group) {
      throw new BadRequestException(
        `Grupo ${row.groupNumber} no existe en sección ${row.sectionNumber}`,
      );
    }
    await this.groupEnroller.enroll(userId, group.id);
  }
}
