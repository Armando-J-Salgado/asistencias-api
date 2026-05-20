import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ISectionRepository, IGroupRepository } from '../../../domain/ports/sections-and-groups.ports';
import type { GroupSnapshot } from '../../../domain/entities/group.entity';
import type { SectionSnapshot } from '../../../domain/entities/section.entity';
import { PrismaService } from '../prisma.service';

function mapSection(row: any): SectionSnapshot {
  return {
    id: row.id,
    sectionNumber: row.sectionNumber,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

function mapGroup(row: any): GroupSnapshot {
  return {
    id: row.id,
    name: row.name,
    number: row.number,
    sectionId: row.sectionId,
    isActive: row.isActive,
  };
}

@Injectable()
export class PrismaSectionRepository implements ISectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listGallery() {
    const rows = await this.prisma.section.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { sectionNumber: 'asc' },
      include: {
        _count: {
          select: {
            groups: {
              where: { deletedAt: null, isActive: true },
            },
            students: true,
          },
        },
      },
    });

    return rows.map((r) => ({
      ...mapSection(r),
      _countGroups: r._count.groups,
      _countStudents: r._count.students,
    }));
  }

  async findActive(id: string) {
    const row = await this.prisma.section.findFirst({
      where: { id, deletedAt: null, isActive: true },
    });
    return row ? mapSection(row) : null;
  }

  async create(sectionNumber: number) {
    try {
      const row = await this.prisma.section.create({
        data: { sectionNumber },
      });
      return mapSection(row);
    } catch {
      throw new ConflictException('Section number already exists');
    }
  }

  async softDelete(id: string) {
    const found = await this.prisma.section.findFirst({ where: { id } });
    if (!found) throw new NotFoundException('Section not found');
    await this.prisma.section.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}

@Injectable()
export class PrismaGroupRepository implements IGroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listActiveForSection(sectionId: string) {
    const rows = await this.prisma.group.findMany({
      where: { sectionId, deletedAt: null, isActive: true },
      orderBy: { number: 'asc' },
    });
    return rows.map(mapGroup);
  }

  async create(input: { sectionId: string; name: string; number: number }) {
    try {
      const row = await this.prisma.group.create({ data: input });
      return mapGroup(row);
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('Group number collision in this section');
      }
      throw e;
    }
  }

  async update(groupId: string, patch: Partial<{ name: string; number: number; isActive: boolean }>) {
    try {
      const row = await this.prisma.group.update({ where: { id: groupId }, data: patch });
      return mapGroup(row);
    } catch {
      throw new NotFoundException('Group not found');
    }
  }

  async findActive(groupId: string) {
    const row = await this.prisma.group.findFirst({
      where: { id: groupId, deletedAt: null, isActive: true },
    });
    return row ? { ...mapGroup(row), sectionId: row.sectionId } : null;
  }

  async members(groupId: string) {
    const studs = await this.prisma.student.findMany({
      where: { groupId },
      include: { user: true },
      orderBy: [{ user: { lastname: 'asc' } }, { user: { name: 'asc' } }],
    });

    return studs
      .filter((s) => s.user?.deletedAt == null)
      .map((s) => ({
        studentId: s.id,
        userId: s.userId,
        name: s.user.name,
        lastname: s.user.lastname,
        idCard: s.idCard,
        imageUrl: s.imageUrl ?? null,
      }));
  }

  async deleteAndUnassignMembers(groupId: string) {
    await this.prisma.$transaction(async (tx) => {
      const found = await tx.group.findFirst({
        where: { id: groupId, deletedAt: null, isActive: true },
        select: { id: true },
      });

      if (!found) {
        throw new NotFoundException('Group not found');
      }

      await tx.student.updateMany({
        where: { groupId },
        data: { groupId: null },
      });

      await tx.group.delete({ where: { id: groupId } });
    });
  }
}
