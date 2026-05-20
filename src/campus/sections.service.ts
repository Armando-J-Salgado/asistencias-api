import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ISectionRepository } from '../domain/ports/sections-and-groups.ports';
import type { IStudentRepository } from '../domain/ports/student-and-attendance.ports';
import {
  SECTION_REPOSITORY,
  STUDENT_REPOSITORY,
} from '../domain/tokens/injection.tokens';

@Injectable()
export class SectionsService {
  constructor(
    @Inject(SECTION_REPOSITORY)
    private readonly sections: ISectionRepository,
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRows: IStudentRepository,
  ) {}

  gallery() {
    return this.sections.listGallery();
  }

  async createAdminOnly(sectionNumber: number) {
    return this.sections.create(sectionNumber);
  }

  async deactivateAdmin(sectionId: string) {
    const found = await this.sections.findActive(sectionId);
    if (!found) throw new NotFoundException('Section not found');
    await this.sections.softDelete(sectionId);
    return { ok: true };
  }

  async getActiveOrThrow(sectionId: string) {
    const s = await this.sections.findActive(sectionId);
    if (!s) throw new NotFoundException('Section not found');
    return s;
  }

  async listStudentsForSection(sectionId: string) {
    await this.getActiveOrThrow(sectionId);
    return this.studentRows.listCardsBySection(sectionId);
  }
}
