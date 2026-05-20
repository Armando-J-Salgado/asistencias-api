/** Domain user aggregates for SOLID layering. */

export abstract class BaseUserAggregate {
  protected constructor(
    readonly id: string,
    readonly name: string,
    readonly lastname: string,
    readonly email: string,
    readonly isActive: boolean,
    readonly isAdmin: boolean,
    readonly passwordHash?: string,
  ) {}

  get fullName(): string {
    return `${this.name} ${this.lastname}`.trim();
  }
}

export class UserAggregate extends BaseUserAggregate {
  readonly deletedAt: Date | null;

  private constructor(
    id: string,
    name: string,
    lastname: string,
    email: string,
    isActive: boolean,
    isAdmin: boolean,
    deletedAt: Date | null,
    passwordHash?: string,
  ) {
    super(id, name, lastname, email, isActive, isAdmin, passwordHash);
    this.deletedAt = deletedAt;
  }

  static fromRecord(r: {
    id: string;
    name: string;
    lastname: string;
    email: string;
    isActive: boolean;
    isAdmin: boolean;
    passwordHash?: string;
    deletedAt?: Date | null;
  }) {
    return new UserAggregate(
      r.id,
      r.name,
      r.lastname,
      r.email,
      r.isActive,
      r.isAdmin,
      r.deletedAt ?? null,
      r.passwordHash,
    );
  }
}

export class StudentAggregate extends BaseUserAggregate {
  private constructor(
    id: string,
    name: string,
    lastname: string,
    email: string,
    isActive: boolean,
    isAdmin: boolean,
    readonly studentId: string,
    readonly idCard: string,
    readonly imageUrl: string | null,
    readonly sectionId: string | null,
    readonly groupId: string | null,
    passwordHash?: string,
  ) {
    super(id, name, lastname, email, isActive, isAdmin, passwordHash);
  }

  static fromJoined(r: {
    user: {
      id: string;
      name: string;
      lastname: string;
      email: string;
      isActive: boolean;
      isAdmin: boolean;
      passwordHash?: string;
    };
    student: {
      id: string;
      idCard: string;
      imageUrl: string | null;
      sectionId: string | null;
      groupId: string | null;
    };
  }) {
    return new StudentAggregate(
      r.user.id,
      r.user.name,
      r.user.lastname,
      r.user.email,
      r.user.isActive,
      r.user.isAdmin,
      r.student.id,
      r.student.idCard,
      r.student.imageUrl,
      r.student.sectionId,
      r.student.groupId,
      r.user.passwordHash,
    );
  }
}

export class AssistantAggregate extends BaseUserAggregate {
  private constructor(
    id: string,
    name: string,
    lastname: string,
    email: string,
    isActive: boolean,
    isAdmin: boolean,
    readonly assistantId: string,
    readonly role: 'AYUDANTE' | 'TUTOR',
    passwordHash?: string,
  ) {
    super(id, name, lastname, email, isActive, isAdmin, passwordHash);
  }

  static fromJoined(r: {
    user: {
      id: string;
      name: string;
      lastname: string;
      email: string;
      isActive: boolean;
      isAdmin: boolean;
      passwordHash?: string;
    };
    assistant: { id: string; role: 'AYUDANTE' | 'TUTOR' };
  }) {
    return new AssistantAggregate(
      r.user.id,
      r.user.name,
      r.user.lastname,
      r.user.email,
      r.user.isActive,
      r.user.isAdmin,
      r.assistant.id,
      r.assistant.role,
      r.user.passwordHash,
    );
  }
}
