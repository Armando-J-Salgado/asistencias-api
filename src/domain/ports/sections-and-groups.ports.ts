import type { SectionSnapshot } from '../entities/section.entity';
import type { GroupSnapshot } from '../entities/group.entity';

export interface ISectionRepository {
  listGallery(): Promise<
    Array<
      SectionSnapshot & {
        _countGroups: number;
        _countStudents: number;
      }
    >
  >;

  findActive(id: string): Promise<SectionSnapshot | null>;

  create(sectionNumber: number): Promise<SectionSnapshot>;

  softDelete(id: string): Promise<void>;
}

export interface IGroupRepository {  listActiveForSection(sectionId: string): Promise<GroupSnapshot[]>;

  create(input: {
    sectionId: string;
    name: string;
    number: number;
  }): Promise<GroupSnapshot>;

  update(
    groupId: string,
    patch: Partial<{ name: string; number: number; isActive: boolean }>,
  ): Promise<GroupSnapshot>;

  findActive(groupId: string): Promise<(GroupSnapshot & { sectionId: string }) | null>;

  members(groupId: string): Promise<
    Array<{
      studentId: string;
      userId: string;
      name: string;
      lastname: string;
      idCard: string;
      imageUrl: string | null;
    }>
  >;

  deleteAndUnassignMembers(groupId: string): Promise<void>;
}
