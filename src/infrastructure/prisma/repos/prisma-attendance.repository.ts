import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { AssistantshipSnapshot } from '../../../domain/entities/assistantship.entity';
import type { AttendanceCheckSnapshot } from '../../../domain/entities/attendance-check.entity';
import { IAttendanceCheckRepository } from '../../../domain/ports/student-and-attendance.ports';
import { PrismaService } from '../prisma.service';

function mapAssistantship(row: any): AssistantshipSnapshot {
  return {
    id: row.id,
    sectionId: row.sectionId,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    isActive: row.isActive,
  };
}

function mapAttendance(row: any): AttendanceCheckSnapshot {
  return {
    id: row.id,
    assistantshipId: row.assistantshipId,
    studentId: row.studentId,
    assistantId: row.assistantId,
    hasAttended: row.hasAttended,
    checkedDate: row.checkedDate ?? null,
    isActive: row.isActive,
  };
}

@Injectable()
export class PrismaAttendanceCheckRepository implements IAttendanceCheckRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listForStudentUser(userId: string) {
    const agg = await this.prisma.student.findUnique({ where: { userId } });
    if (!agg) return [];
    const checks = await this.prisma.attendanceCheck.findMany({
      where: { studentId: agg.id, deletedAt: null, isActive: true },
      include: {
        assistantship: true,
      },
      orderBy: { assistantship: { date: 'desc' } },
    });

    return checks.map((ch) => ({
      ...mapAttendance(ch),
      assistantship: mapAssistantship(ch.assistantship),
    }));
  }

  async findForStudent(checkId: string, userId: string) {
    const agg = await this.prisma.student.findUnique({ where: { userId } });
    if (!agg) return null;
    const ch = await this.prisma.attendanceCheck.findFirst({
      where: { id: checkId, studentId: agg.id, deletedAt: null, isActive: true },
      include: { assistantship: true },
    });
    return ch
      ? { ...mapAttendance(ch), assistantship: mapAssistantship(ch.assistantship) }
      : null;
  }

  async findActiveCheckById(checkId: string) {
    const row = await this.prisma.attendanceCheck.findFirst({
      where: { id: checkId, deletedAt: null, isActive: true },
    });
    return row ? mapAttendance(row) : null;
  }

  async getAssistantPreview(checkId: string) {
    const ch = await this.prisma.attendanceCheck.findFirst({
      where: { id: checkId, deletedAt: null, isActive: true },
      include: {
        assistantship: true,
        student: { include: { user: true } },
      },
    });
    if (!ch || !ch.student || ch.student.user.deletedAt != null) return null;

    return {
      ...mapAttendance(ch),
      assistantship: mapAssistantship(ch.assistantship),
      sectionIdViaAssistantship: ch.assistantship.sectionId,
      studentSectionId: ch.student.sectionId ?? null,
      student: {
        studentId: ch.student.id,
        userId: ch.student.userId,
        name: ch.student.user.name,
        lastname: ch.student.user.lastname,
        idCard: ch.student.idCard,
        imageUrl: ch.student.imageUrl ?? null,
      },
    };
  }

  async markDecision(input: {
    checkId: string;
    approve: boolean;
    assistantAssistantId: string;
  }) {
    const preview = await this.getAssistantPreview(input.checkId);
    if (!preview)
      throw new NotFoundException('Attendance check unavailable');

    if (preview.studentSectionId !== preview.sectionIdViaAssistantship) {
      throw new ForbiddenException('Student is not in this assistantship section');
    }

    const updated = await this.prisma.attendanceCheck.update({
      where: { id: input.checkId },
      data: {
        hasAttended: input.approve,
        checkedDate: input.approve ? new Date() : null,
        assistantId: input.approve ? input.assistantAssistantId : null,
      },
    });
    return mapAttendance(updated);
  }

  async seedChecksForAssistantship(input: {
    assistantshipId: string;
    sectionId: string;
  }) {
    const students = await this.prisma.student.findMany({
      where: {
        sectionId: input.sectionId,
        user: { isActive: true, deletedAt: null },
      },
      select: { id: true },
    });

    if (!students.length) return;

    await this.prisma.attendanceCheck.createMany({
      data: students.map((s) => ({
        assistantshipId: input.assistantshipId,
        studentId: s.id,
      })),
      skipDuplicates: true,
    });
  }

  async seedChecksForStudentInSection(input: {
    studentId: string;
    sectionId: string;
  }) {
    const assistantships = await this.prisma.assistantship.findMany({
      where: {
        sectionId: input.sectionId,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!assistantships.length) return;

    await this.prisma.attendanceCheck.createMany({
      data: assistantships.map((a) => ({
        assistantshipId: a.id,
        studentId: input.studentId,
      })),
      skipDuplicates: true,
    });
  }

  async dashboard(assistantshipId: string) {
    const rows = await this.prisma.attendanceCheck.findMany({
      where: { assistantshipId, deletedAt: null, isActive: true },
      include: {
        student: {
          include: {
            user: true,
            group: true,
          },
        },
      },
    });

    type RowUi = AttendanceCheckSnapshot & {
      student: typeof rows[number]['student'];
    };

    const validRows: RowUi[] = rows.filter(
      (r) => r.student?.user?.deletedAt == null,
    );

    const totalStudents = validRows.length;
    const checkedStudents = validRows.filter((r) => r.hasAttended).length;

    const groupsMap = new Map<
      string,
      {
        label: string;
        groupId: string | null;
        students: Array<{
          checkId: string;
          studentId: string;
          userId: string;
          name: string;
          lastname: string;
          idCard: string;
          imageUrl: string | null;
          attended: boolean;
        }>;
      }
    >();

    function keyFor(student: (typeof rows)[number]['student']) {
      if (!student.groupId) return '__ungrouped__';
      return `g:${student.groupId}`;
    }

    for (const r of validRows) {
      const sid = keyFor(r.student);
      const label =
        sid === '__ungrouped__'
          ? 'Sin grupo'
          : `Grupo ${r.student.group!.number} — ${r.student.group!.name}`;

      let bucket = groupsMap.get(sid);
      if (!bucket) {
        bucket = {
          label,
          groupId: r.student.groupId,
          students: [],
        };
        groupsMap.set(sid, bucket);
      }
      bucket.students.push({
        checkId: r.id,
        studentId: r.studentId,
        userId: r.student.user.id,
        name: r.student.user.name,
        lastname: r.student.user.lastname,
        idCard: r.student.idCard,
        imageUrl: r.student.imageUrl ?? null,
        attended: r.hasAttended,
      });
    }

    const groupsUi = [...groupsMap.values()].map((g) => ({
      groupId: g.groupId,
      label: g.label,
      students: g.students.sort((a, b) =>
        `${a.lastname} ${a.name}`.localeCompare(`${b.lastname} ${b.name}`),
      ),
    }));

    let completeGroups = 0;
    let missingGroups = 0;

    for (const g of groupsUi) {
      if (!g.students.length) continue;
      const missing = g.students.some((s) => !s.attended);
      if (missing) missingGroups++;
      else completeGroups++;
    }

    return {
      totalStudents,
      checkedStudents,
      completeGroups,
      missingGroups,
      groups: groupsUi,
    };
  }
}
