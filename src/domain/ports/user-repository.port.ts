import type {
  RefreshToken as PrismaRefresh,
  PasswordResetToken as PrismaPwdReset,
} from '@prisma/client';
import { UserAggregate } from '../../domain/entities/base-user.abstract';

export interface IUserRepository {
  /** Returns user inclusive password hash only for credential checks. */

  findByEmailIncludingPassword(email: string): Promise<UserAggregate | null>;

  findByIdIncludingPassword(userId: string): Promise<UserAggregate | null>;

  findByIdSafe(userId: string): Promise<UserAggregate | null>;

  createBareUser(input: {
    name: string;
    lastname: string;
    email: string;
    passwordHash: string;
    isAdmin?: boolean;
  }): Promise<UserAggregate>;

  updateProfile(
    userId: string,
    patch: Partial<{ name: string; lastname: string }>,
  ): Promise<UserAggregate>;

  updatePassword(userId: string, passwordHash: string): Promise<void>;

  deactivate(userId: string): Promise<void>;

  setActive(userId: string, isActive: boolean): Promise<void>;

  setAdmin(userId: string, isAdmin: boolean): Promise<void>;

  deleteRefreshTokenByHash(tokenHash: string): Promise<number>;

  createRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;

  findRefresh(tokenHash: string): Promise<PrismaRefresh | null>;

  revokeRefreshToken(tokenId: string): Promise<void>;

  revokeAllRefreshForUser(userId: string): Promise<void>;

  createPasswordReset(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;

  findPasswordReset(tokenHash: string): Promise<PrismaPwdReset | null>;

  markPasswordResetUsed(id: string): Promise<void>;

  listBriefForAdmin(): Promise<AdminUserBrief[]>;

  findBriefPublicByIdForAdmin(targetUserId: string): Promise<AdminUserBrief | null>;
}

export type AdminUserBrief = {
  userId: string;
  email: string;
  name: string;
  lastname: string;
  isActive: boolean;
  isAdmin: boolean;
  studentId: string | null;
  sectionId: string | null;
  sectionNumber: number | null;
  assistantId: string | null;
  assistantRole: string | null;
};

