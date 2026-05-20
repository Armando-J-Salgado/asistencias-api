import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPrincipal } from '../auth/auth.types';
import { StorageService } from './storage.service';
import { IsOptional, IsString, Length } from 'class-validator';

class MintUploadDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  fileName?: string;
}

@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('student-photo-upload-url')
  @Roles('student')
  mint(@CurrentUser() user: JwtPrincipal, @Body() body: MintUploadDto) {
    return this.storage.mintStudentPhotoUpload(user, body.fileName ?? 'photo.jpg');
  }

  @Post('student-photo')
  @Roles('student')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: JwtPrincipal,
    @UploadedFile() file?: { buffer: Buffer; mimetype?: string; originalname?: string },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo de imagen requerido (campo file)');
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Solo se permiten archivos de imagen');
    }
    return this.storage.uploadStudentPhoto(user, {
      buffer: file.buffer,
      mimetype: file.mimetype ?? 'application/octet-stream',
      originalname: file.originalname ?? 'photo.jpg',
    });
  }
}
