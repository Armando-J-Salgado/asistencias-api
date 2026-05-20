import { MailerService } from '@nestjs-modules/mailer';
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

import type { JwtPrincipal, AppPersonaKind } from './auth.types';
import type { IUserRepository } from '../domain/ports/user-repository.port';
import type { IStudentRepository } from '../domain/ports/student-and-attendance.ports';
import type { IAssistantRepository } from '../domain/ports/assistant-repository.port';
import {
  USER_REPOSITORY,
  STUDENT_REPOSITORY,
  ASSISTANT_REPOSITORY,
} from '../domain/tokens/injection.tokens';

import type { LoginDto } from './dto/auth.requests';
import type { RegisterAssistantDto } from './dto/auth.requests';
import type { RegisterStudentDto } from './dto/auth.requests';

import { StudentValidator } from '../domain/validators/student.validator';
import { AssistantValidator } from '../domain/validators/assistant.validator';

import { PrismaUserRepository } from '../infrastructure/prisma/repos/prisma-user.repository';

function parseJwtExpiresToSeconds(raw: string): number {
  const m = /^([0-9]+)(s|m|h|d)$/.exec(raw.trim());
  if (!m) return 15 * 60;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  switch (unit) {
    case 's':
      return n;
    case 'm':
      return n * 60;
    case 'h':
      return n * 3600;
    case 'd':
      return n * 86400;
    default:
      return 15 * 60;
  }
}

@Injectable()
export class AuthService {
  private readonly studentValidator = new StudentValidator();
  private readonly assistantValidator = new AssistantValidator();

  constructor(
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
    private readonly mailer: MailerService,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository,
    @Inject(ASSISTANT_REPOSITORY) private readonly assistants: IAssistantRepository,
  ) {}

  private async personasFor(userId: string): Promise<AppPersonaKind[]> {
    const u = await this.users.findByIdSafe(userId);
    if (!u) return [];
    const personas: AppPersonaKind[] = [];
    if (u.isAdmin) personas.push('ADMIN');
    const s = await this.students.findAggregateByUserId(userId);
    if (s) personas.push('STUDENT');
    const a = await this.assistants.findAggregateByUserId(userId);
    if (a) personas.push('ASSISTANT');

    return [...new Set(personas)];
  }

  private async signAccessToken(
    payload: Omit<JwtPrincipal, 'personas'> & { personas: AppPersonaKind[] },
  ) {
    const expiresRaw = this.cfg.get<string>('jwtAccessExpires') ?? '15m';
    return this.jwt.signAsync(
      { sub: payload.sub, email: payload.email, personas: payload.personas },
      {
        secret: this.cfg.get<string>('jwtSecret'),
        expiresIn: expiresRaw,
      } as any,
    );
  }

  async issueTokensForUserId(userId: string) {
    const u = await this.users.findByIdSafe(userId);
    if (!u) throw new UnauthorizedException();
    if (!u.isActive) throw new UnauthorizedException();

    const personas = await this.personasFor(userId);
    const accessToken = await this.signAccessToken({
      sub: u.id,
      email: u.email,
      personas,
    });

    const refreshRaw = randomBytes(48).toString('hex');
    const refreshHash = PrismaUserRepository.hashOpaqueToken(refreshRaw);

    const refreshExpiresRaw =
      this.cfg.get<string>('jwtRefreshExpires') ?? '7d';
    const refreshSeconds = parseJwtExpiresToSeconds(refreshExpiresRaw);
    const expiresAt = new Date(Date.now() + refreshSeconds * 1000);

    await this.users.createRefreshToken(u.id, refreshHash, expiresAt);

    return { accessToken, refreshToken: refreshRaw };
  }

  async login(dto: LoginDto) {
    const entity = await this.users.findByEmailIncludingPassword(dto.email);
    if (!entity?.passwordHash) throw new UnauthorizedException();

    const ok = await argon2
      .verify(entity.passwordHash, dto.password)
      .catch(() => false);
    if (!ok || !entity.isActive) throw new UnauthorizedException();

    return this.issueTokensForUserId(entity.id);
  }

  async registerStudent(dto: RegisterStudentDto) {
    this.studentValidator.validateStudentCreate({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      lastname: dto.lastname,
      idCard: dto.idCard,
    });

    const existing = await this.users.findByEmailIncludingPassword(dto.email);
    if (existing) throw new BadRequestException('Email already registered');

    const pwd = await argon2.hash(dto.password);
    const user = await this.users.createBareUser({
      email: dto.email,
      passwordHash: pwd,
      name: dto.name,
      lastname: dto.lastname,
    });

    await this.students.createProfile({
      userId: user.id,
      idCard: dto.idCard,
    });

    return this.issueTokensForUserId(user.id);
  }

  async registerAssistant(dto: RegisterAssistantDto) {
    this.assistantValidator.validateAssistantCreate(dto);

    const existing = await this.users.findByEmailIncludingPassword(dto.email);
    if (existing) throw new BadRequestException('Email already registered');

    const pwd = await argon2.hash(dto.password);

    const user = await this.users.createBareUser({
      email: dto.email,
      passwordHash: pwd,
      name: dto.name,
      lastname: dto.lastname,
    });

    await this.assistants.createProfile({
      userId: user.id,
      role: dto.role,
    });

    return this.issueTokensForUserId(user.id);
  }

  async refresh(refreshToken: string) {
    const hashed = PrismaUserRepository.hashOpaqueToken(refreshToken);
    const row = await this.users.findRefresh(hashed);
    if (!row?.id || row.revokedAt) throw new UnauthorizedException();
    if (row.expiresAt.getTime() < Date.now()) throw new UnauthorizedException();

    await this.users.revokeRefreshToken(row.id);
    return this.issueTokensForUserId(row.userId);
  }

  async forgotPassword(email: string) {
    const user = await this.users.findByEmailIncludingPassword(email);
    if (!user?.isActive) {
      return { ok: true as const };
    }

    const raw = randomBytes(32).toString('hex');
    const hashed = PrismaUserRepository.hashOpaqueToken(raw);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.users.createPasswordReset({
      userId: user.id,
      tokenHash: hashed,
      expiresAt,
    });

    const linkBase = `${this.cfg.get<string>('webPublicUrl')}/reset-password?token=`;

    try {
      await this.mailer.sendMail({
        to: user.email,
        subject: 'Recuperación de contraseña',
        text: `Para restablecer tu contraseña abre este enlace (caduca pronto):\n${linkBase}${raw}\n`,
        html: `<p>Para restablecer tu contraseña usa:</p><p><a href="${linkBase}${raw}">Restablecer contraseña</a></p>`,
      });
    } catch {
      /* SMTP misconfiguration */
    }

    return { ok: true as const };
  }

  async resetPassword(tokenPlain: string, newPasswordRaw: string) {
    const hash = PrismaUserRepository.hashOpaqueToken(tokenPlain);
    const reset = await this.users.findPasswordReset(hash);
    if (!reset?.id || reset.usedAt) throw new BadRequestException('Invalid token');
    if (reset.expiresAt.getTime() < Date.now())
      throw new BadRequestException('Expired token');

    const nextHash = await argon2.hash(newPasswordRaw);

    await this.users.updatePassword(reset.userId, nextHash);
    await this.users.markPasswordResetUsed(reset.id);
    await this.users.revokeAllRefreshForUser(reset.userId);
  }
}
