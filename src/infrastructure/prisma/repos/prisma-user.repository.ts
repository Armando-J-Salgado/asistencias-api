import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import type { IUserRepository } from '../../../domain/ports/user-repository.port';
import { UserAggregate } from '../../../domain/entities/base-user.abstract';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmailIncludingPassword(email: string) {
    const row = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    return row ? this.map(row, true) : null;
  }

  async findByIdIncludingPassword(userId: string) {
    const row = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    return row ? this.map(row, true) : null;
  }

  async findByIdSafe(userId: string) {
    const row = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    return row ? this.map(row, false) : null;
  }

  async createBareUser(input: {
    name: string;
    lastname: string;
    email: string;
    passwordHash: string;
    isAdmin?: boolean;
  }) {
    const created = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        lastname: input.lastname,
        isAdmin: input.isAdmin ?? false,
      },
    });
    return this.map(created, false);
  }

  async updateProfile(userId: string, patch: Partial<{ name: string; lastname: string }>) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: patch,
    });
    return this.map(updated, false);
  }

  async updatePassword(userId: string, passwordHash: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async deactivate(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  async setActive(userId: string, isActive: boolean) {


    await this.prisma.user.update({ where: { id: userId }, data: { isActive } });


  }


  async setAdmin(userId: string, isAdmin: boolean) {
    await this.prisma.user.update({ where: { id: userId }, data: { isAdmin } });
  }

  async deleteRefreshTokenByHash(tokenHash: string) {
    const res = await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    return res.count;
  }

  async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findRefresh(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({ where: { tokenHash } });
  }

  async revokeRefreshToken(tokenId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllRefreshForUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async createPasswordReset(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    await this.prisma.passwordResetToken.create({ data: params });
  }

  async findPasswordReset(tokenHash: string) {
    return this.prisma.passwordResetToken.findFirst({ where: { tokenHash } });
  }

  async markPasswordResetUsed(id: string) {
    await this.prisma.passwordResetToken.updateMany({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async listBriefForAdmin() {
    const rows = await this.prisma.user.findMany({
      where: { deletedAt: null },
      include: { student: { include: { section: true } }, assistant: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((u) => ({
      userId: u.id,
      email: u.email,
      name: u.name,
      lastname: u.lastname,
      isActive: u.isActive,
      isAdmin: u.isAdmin,
      studentId: u.student?.id ?? null,
      sectionId: u.student?.sectionId ?? null,
      sectionNumber: u.student?.section?.sectionNumber ?? null,
      assistantId: u.assistant?.id ?? null,
      assistantRole: u.assistant?.role ?? null,
    }));
  }

  async findBriefPublicByIdForAdmin(targetUserId: string) {
    const u = await this.prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      include: { student: { include: { section: true } }, assistant: true },
    });
    if (!u) return null;
    return {
      userId: u.id,
      email: u.email,
      name: u.name,
      lastname: u.lastname,
      isActive: u.isActive,
      isAdmin: u.isAdmin,
      studentId: u.student?.id ?? null,
      sectionId: u.student?.sectionId ?? null,
      sectionNumber: u.student?.section?.sectionNumber ?? null,
      assistantId: u.assistant?.id ?? null,
      assistantRole: u.assistant?.role ?? null,
    };
  }

  static hashOpaqueToken(raw: string) {
    return createHash('sha256').update(raw, 'utf8').digest('hex');
  }

  /** When `includePasswordHash` is true, keep hash for bcrypt checks. */
  private map(row: any, includePasswordHash: boolean) {
    const passwordHash =
      includePasswordHash && typeof row.passwordHash === 'string'
        ? row.passwordHash
        : undefined;
    return UserAggregate.fromRecord({
      id: row.id,
      email: row.email,
      lastname: row.lastname,
      name: row.name,
      isActive: row.isActive,
      isAdmin: row.isAdmin,
      passwordHash,
      deletedAt: row.deletedAt,
    });
  }
}
