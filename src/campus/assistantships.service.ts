import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { JwtPrincipal } from '../auth/auth.types';
import type { ISectionRepository } from '../domain/ports/sections-and-groups.ports';
import type { IAssistantshipRepository } from '../domain/ports/assistantships.port';
import {
  ASSISTANTSHIP_REPOSITORY,
  SECTION_REPOSITORY,
} from '../domain/tokens/injection.tokens';
import { AssistantshipValidator } from '../domain/validators/assistantship.validator';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

@Injectable()
export class AssistantshipsService {
  private readonly validator = new AssistantshipValidator();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SECTION_REPOSITORY)
    private readonly sections: ISectionRepository,
    @Inject(ASSISTANTSHIP_REPOSITORY)
    private readonly assistantships: IAssistantshipRepository,
  ) {}

  private assertStaff(actor: JwtPrincipal) {
    const ok =
      actor.personas.includes('ADMIN') || actor.personas.includes('ASSISTANT');
    if (!ok) throw new ForbiddenException('Only assistants/admins');
  }

  async list(sectionId: string) {
    const s = await this.sections.findActive(sectionId);
    if (!s) throw new NotFoundException('Section not found');
    return this.assistantships.listForSection(sectionId);
  }

  async create(
    sectionId: string,
    actor: JwtPrincipal,
    dto: { date: string; startTime: string; endTime: string },
  ) {
    this.assertStaff(actor);
    this.validator.validateCreate({
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });

    const section = await this.sections.findActive(sectionId);
    if (!section) throw new NotFoundException('Section not found');

    const jsDate = new Date(dto.date);

    const createdRow = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.assistantship.create({
        data: {
          sectionId,
          date: jsDate,
          startTime: dto.startTime,
          endTime: dto.endTime,
        },
      });

      const studs = await tx.student.findMany({
        where: {
          sectionId,
          user: {
            deletedAt: null,
            isActive: true,
          },
        },
        select: { id: true },
      });

      if (studs.length) {
        await tx.attendanceCheck.createMany({
          data: studs.map((s) => ({
            assistantshipId: created.id,
            studentId: s.id,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    return {
      id: createdRow.id,
      sectionId: createdRow.sectionId,
      date: createdRow.date,
      startTime: createdRow.startTime,
      endTime: createdRow.endTime,
      isActive: createdRow.isActive,
    };
  }

  async patch(
    assistantshipId: string,
    actor: JwtPrincipal,
    patch: Partial<{
      date: string;
      startTime: string;
      endTime: string;
      isActive: boolean;
    }>,
  ) {
    this.assertStaff(actor);

    const current = await this.assistantships.findActive(assistantshipId);
    if (!current) throw new NotFoundException('Assistantship not found');

    const next: Partial<{
      date: Date;
      startTime: string;
      endTime: string;
      isActive: boolean;
      deletedAt: Date | null;
    }> = {};

    if (patch.startTime !== undefined) next.startTime = patch.startTime;
    if (patch.endTime !== undefined) next.endTime = patch.endTime;
    if (patch.isActive !== undefined) next.isActive = patch.isActive;
    if (patch.date !== undefined) next.date = new Date(patch.date);
    if (patch.isActive === false) {
      next.deletedAt = new Date();
    }

    return this.assistantships.update(assistantshipId, next as any);

  }



}
