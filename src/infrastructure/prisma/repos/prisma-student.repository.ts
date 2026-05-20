import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { StudentAggregate } from '../../../domain/entities/base-user.abstract';
import { IStudentRepository } from '../../../domain/ports/student-and-attendance.ports';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaStudentRepository implements IStudentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAggregateByUserId(userId: string) {
    const row = await this.prisma.student.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!row?.user || row.user.deletedAt != null) return null;
    return StudentAggregate.fromJoined({ user: row.user, student: row });
  }

  async findByStudentId(studentId: string) {
    const row = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });
    if (!row?.user || row.user.deletedAt != null) return null;
    return StudentAggregate.fromJoined({ user: row.user, student: row });
  }

  async createProfile(input: { userId: string; idCard: string }) {
    try {
      const created = await this.prisma.student.create({
        data: {
          userId: input.userId,
          idCard: input.idCard,
        },
        include: { user: true },
      });
      return StudentAggregate.fromJoined({ user: created.user, student: created });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('Student profile already exists');
      }
      throw e;
    }
  }

  async enrollSection(userId: string, sectionId: string) {
    const studentRow = await this.prisma.student.findUnique({
      where: { userId },
      include: { group: true },
    });
    if (!studentRow) throw new NotFoundException('Missing student profile');

    const incomingGroupSection = studentRow.groupId
      ? await this.prisma.group.findUnique({ where: { id: studentRow.groupId } })
      : null;

    const clearingGroupNeeded =
      studentRow.groupId &&
      incomingGroupSection &&
      incomingGroupSection.sectionId !== sectionId;

    await this.prisma.$transaction(async (tx) => {
      if (clearingGroupNeeded) {
        await tx.student.update({
          where: { userId },
          data: { groupId: null },
        });
      }
      await tx.student.update({
        where: { userId },
        data: { sectionId },
      });
    });
  }

  async setGroup(studentUserId: string, groupId: string | null) {
    await this.prisma.student.update({
      where: { userId: studentUserId },
      data: { groupId },
    });
  }

  async updateExtrasByUser(
    studentUserId: string,
    patch: Partial<{ idCard: string; imageUrl: string | null }>,
  ) {

    await this.prisma.student.update({
      where: { userId: studentUserId },
      data: patch,
    });


  }



  async listCardsBySection(sectionId: string) {
    const rows = await this.prisma.student.findMany({
      where: { sectionId },
      include: {
        user: true,
        group: true,
      },
      orderBy: [{ user: { lastname: 'asc' } }, { user: { name: 'asc' } }],
    });

    return rows
      .filter((r) => r.user?.deletedAt == null)
      .map((r) => ({
        studentId: r.id,
        userId: r.user.id,
        name: r.user.name,
        lastname: r.user.lastname,
        email: r.user.email,
        idCard: r.idCard,
        imageUrl: r.imageUrl ?? null,
        groupId: r.groupId ?? null,
        groupName: r.group?.name ?? null,
        groupNumber: r.group?.number ?? null,
      }));
  }
}
