import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ISectionRepository } from '../ports/sections-and-groups.ports';
import type {
  IAttendanceCheckRepository,
  IStudentRepository,
} from '../ports/student-and-attendance.ports';
import {
  ATTENDANCE_CHECK_REPOSITORY,
  SECTION_REPOSITORY,
  STUDENT_REPOSITORY,
} from '../tokens/injection.tokens';

@Injectable()
export class StudentSectionEnrollerDomain {
  constructor(
    @Inject(SECTION_REPOSITORY) private readonly sections: ISectionRepository,
    @Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository,
    @Inject(ATTENDANCE_CHECK_REPOSITORY)
    private readonly attendance: IAttendanceCheckRepository,
  ) {}

  async enroll(
    studentUserId: string,
    sectionId: string,
    opts?: { allowReassign?: boolean },
  ): Promise<void> {
    const section = await this.sections.findActive(sectionId);
    if (!section) throw new NotFoundException('Section not found');
    const studentAgg = await this.students.findAggregateByUserId(studentUserId);
    if (!studentAgg) throw new NotFoundException('Student profile missing');
    if (studentAgg.sectionId && !opts?.allowReassign) {
      throw new ConflictException('Student is already enrolled in a section');
    }
    await this.students.enrollSection(studentUserId, sectionId);
    await this.attendance.seedChecksForStudentInSection({
      studentId: studentAgg.studentId,
      sectionId,
    });
  }
}
