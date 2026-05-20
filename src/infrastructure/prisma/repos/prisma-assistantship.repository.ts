import { Injectable, NotFoundException } from '@nestjs/common';
import type { AssistantshipSnapshot } from '../../../domain/entities/assistantship.entity';
import { IAssistantshipRepository } from '../../../domain/ports/assistantships.port';
import { PrismaService } from '../prisma.service';

function mapRow(row: any): AssistantshipSnapshot {
  return {
    id: row.id,
    sectionId: row.sectionId,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    isActive: row.isActive,
  };
}

@Injectable()
export class PrismaAssistantshipRepository implements IAssistantshipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listForSection(sectionId: string) {
    const rows = await this.prisma.assistantship.findMany({
      where: { sectionId, deletedAt: null },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapRow);
  }

  async create(
    input: Omit<AssistantshipSnapshot, 'id'> & Partial<{ deletedAt?: Date | null }>,
  ) {
    try {
      const row = await this.prisma.assistantship.create({
        data: {
          sectionId: input.sectionId,
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          isActive: input.isActive,
        },
      });
      return mapRow(row);
    } catch (e: any) {
      if (e?.code === 'P2003') throw new NotFoundException('Section not found');
      throw e;
    }
  }

  async update(
    id: string,
    patch: Partial<
      Omit<AssistantshipSnapshot, 'id'> & { deletedAt: Date | null }
    >,
  ) {
    try {
      const row = await this.prisma.assistantship.update({ where: { id }, data: patch });
      return mapRow(row);
    } catch {
      throw new NotFoundException('Assistantship not found');
    }
  }

  async findActive(id: string) {
    const row = await this.prisma.assistantship.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? mapRow(row) : null;
  }
}
