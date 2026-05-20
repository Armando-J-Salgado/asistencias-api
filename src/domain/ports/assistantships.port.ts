import type { AssistantshipSnapshot } from '../../domain/entities/assistantship.entity';

export interface IAssistantshipRepository {
  listForSection(sectionId: string): Promise<AssistantshipSnapshot[]>;

  create(input: Omit<AssistantshipSnapshot, 'id'>): Promise<AssistantshipSnapshot>;

  update(
    id: string,
    patch: Partial<
      Omit<AssistantshipSnapshot, 'id'> & { deletedAt: Date | null }
    >,
  ): Promise<AssistantshipSnapshot>;

  findActive(id: string): Promise<AssistantshipSnapshot | null>;
}
