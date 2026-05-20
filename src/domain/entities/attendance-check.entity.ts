/** Attendance check aggregate. */

export interface AttendanceCheckSnapshot {
  id: string;
  assistantshipId: string;
  studentId: string;
  assistantId?: string | null;
  hasAttended: boolean;
  checkedDate?: Date | null;
  isActive: boolean;
}
