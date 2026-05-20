import { Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { IGroupRepository } from '../ports/sections-and-groups.ports';
import type { IStudentRepository } from '../ports/student-and-attendance.ports';
import {
  GROUP_REPOSITORY,
  STUDENT_REPOSITORY,
} from '../tokens/injection.tokens';

@Injectable()
export class GroupEnrollerDomain {
  constructor(
    @Inject(GROUP_REPOSITORY) private readonly groups: IGroupRepository,
    @Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository,
  ) {}

  async enroll(studentUserId: string, groupId: string): Promise<void> {
    const group = await this.groups.findActive(groupId);
    if (!group) throw new NotFoundException('Group not available');
    const student = await this.students.findAggregateByUserId(studentUserId);
    if (!student) throw new NotFoundException('Student profile missing');
    if (!student.sectionId || student.sectionId !== group.sectionId) {
      throw new ForbiddenException('Student must belong to the same section');
    }

    await this.students.setGroup(studentUserId, groupId);
  }

  async leave(studentUserId: string): Promise<void> {
    const student = await this.students.findAggregateByUserId(studentUserId);
    if (!student) throw new NotFoundException('Student profile missing');
    await this.students.setGroup(studentUserId, null);
  }
}
