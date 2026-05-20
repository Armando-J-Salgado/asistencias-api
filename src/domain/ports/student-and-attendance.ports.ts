import { StudentAggregate } from '../../domain/entities/base-user.abstract';
import type { AssistantshipSnapshot } from '../../domain/entities/assistantship.entity';
import type { AttendanceCheckSnapshot } from '../../domain/entities/attendance-check.entity';

export interface IStudentRepository {
  findAggregateByUserId(userId: string): Promise<StudentAggregate | null>;

  findByStudentId(studentId: string): Promise<StudentAggregate | null>;

  createProfile(input: {
    userId: string;
    idCard: string;
  }): Promise<StudentAggregate>;

  enrollSection(userId: string, sectionId: string): Promise<void>;

  setGroup(studentUserId: string, groupId: string | null): Promise<void>;

  updateExtrasByUser(
    studentUserId: string,
    patch: Partial<{ idCard: string; imageUrl: string | null }>,
  ): Promise<void>;

  listCardsBySection(sectionId: string): Promise<
    Array<{
      studentId: string;
      userId: string;
      name: string;
      lastname: string;
      email: string;
      idCard: string;
      imageUrl: string | null;
      groupId: string | null;
      groupName: string | null;
      groupNumber: number | null;
    }>
  >;
}
export interface IAttendanceCheckRepository {
  listForStudentUser(userId: string): Promise<
    Array<
      AttendanceCheckSnapshot & {
        assistantship: AssistantshipSnapshot;
      }
    >
  >;

  findForStudent(checkId: string, userId: string): Promise<
    | (AttendanceCheckSnapshot & {
        assistantship: AssistantshipSnapshot;
      })
    | null
  >;

  getAssistantPreview(checkId: string): Promise<
    | (AttendanceCheckSnapshot & {
        sectionIdViaAssistantship: string;
        studentSectionId: string | null;
        assistantship: AssistantshipSnapshot;
        student: {
          studentId: string;
          userId: string;
          name: string;
          lastname: string;
          idCard: string;
          imageUrl: string | null;
        };
      })
    | null
  >;

  findActiveCheckById(checkId: string): Promise<
    AttendanceCheckSnapshot | null
  >;

  markDecision(input: {
    checkId: string;
    approve: boolean;
    assistantAssistantId: string;
  }): Promise<AttendanceCheckSnapshot>;

  dashboard(assistantshipId: string): Promise<{
    totalStudents: number;
    checkedStudents: number;
    completeGroups: number;
    missingGroups: number;
    groups: Array<{
      groupId: string | null;
      label: string;
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
    }>;
  }>;

  seedChecksForAssistantship(input: {
    assistantshipId: string;
    sectionId: string;
  }): Promise<void>;

  seedChecksForStudentInSection(input: {
    studentId: string;
    sectionId: string;
  }): Promise<void>;
}
