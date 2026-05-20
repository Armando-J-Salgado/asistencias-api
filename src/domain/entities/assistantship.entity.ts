/** Assistantship aggregate. */

export interface AssistantshipSnapshot {
  id: string;
  sectionId: string;
  date: Date;
  startTime: string;
  endTime: string;
  isActive: boolean;
}
