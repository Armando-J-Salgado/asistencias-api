import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { JwtPrincipal } from '../auth/auth.types';
import type { IStudentRepository } from '../domain/ports/student-and-attendance.ports';
import { STUDENT_REPOSITORY } from '../domain/tokens/injection.tokens';

type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@Injectable()
export class StorageService {
  constructor(
    private readonly cfg: ConfigService,
    @Inject(STUDENT_REPOSITORY)
    private readonly students: IStudentRepository,
  ) {}

  async mintStudentPhotoUpload(actor: JwtPrincipal, fileNameSuggestion: string) {
    const { studentId } = await this.requireStudent(actor);
    const objectPath = this.buildObjectPath(studentId, fileNameSuggestion);
    const { supabase, bucket } = this.requireSupabase();

    const signed = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(objectPath);

    if (signed.error) {
      throw new ForbiddenException(
        `Could not mint upload URL: ${signed.error.message}`,
      );
    }

    return {
      bucket,
      path: objectPath,
      signedUrl: signed.data.signedUrl,
      token: signed.data.token,
    };
  }

  async uploadStudentPhoto(actor: JwtPrincipal, file: UploadedImage) {
    const { studentId } = await this.requireStudent(actor);
    const objectPath = this.buildObjectPath(studentId, file.originalname);

    const { supabase, bucket } = this.requireSupabase();
    const { error } = await supabase.storage.from(bucket).upload(objectPath, file.buffer, {
      contentType: file.mimetype || 'application/octet-stream',
      upsert: true,
    });

    if (error) {
      throw new BadRequestException(`No se pudo subir la foto: ${error.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    return { path: objectPath, publicUrl: data.publicUrl };
  }

  private async requireStudent(actor: JwtPrincipal) {
    const student = await this.students.findAggregateByUserId(actor.sub);
    if (!student?.studentId || !actor.personas.includes('STUDENT')) {
      throw new ForbiddenException('Student only');
    }
    return { studentId: student.studentId };
  }

  private buildObjectPath(studentId: string, fileNameSuggestion: string) {
    const safeTail = String(fileNameSuggestion || 'photo.jpg')
      .replace(/[^a-zA-Z0-9._-]+/g, '')
      .slice(0, 120);
    return `students/${studentId}/${Date.now()}-${safeTail}`;
  }

  private requireSupabase(): { supabase: SupabaseClient; bucket: string } {
    const url = this.cfg.get<string>('supabaseUrl');
    const key = this.cfg.get<string>('supabaseServiceRoleKey');
    const bucket = this.cfg.get<string>('supabaseStudentPhotosBucket');
    if (!url || !key || !bucket) {
      throw new ForbiddenException('Storage not configured');
    }
    if (key.startsWith('sb_publishable_')) {
      throw new ForbiddenException(
        'SUPABASE_SERVICE_ROLE_KEY must be the service role / secret key, not the publishable key',
      );
    }
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return { supabase, bucket };
  }
}
