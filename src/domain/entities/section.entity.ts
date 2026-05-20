/** Section aggregate (minimal domain shape). */

export interface SectionSnapshot {
  id: string;
  sectionNumber: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
