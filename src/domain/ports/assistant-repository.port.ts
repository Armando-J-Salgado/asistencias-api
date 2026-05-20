import { AssistantAggregate } from '../../domain/entities/base-user.abstract';

export interface IAssistantRepository {
  findAggregateByUserId(userId: string): Promise<AssistantAggregate | null>;

  createProfile(input: {
    userId: string;
    role: 'AYUDANTE' | 'TUTOR';
  }): Promise<AssistantAggregate>;
}
