import { Module } from '@nestjs/common';

import { RepositoryBindingsModule } from '../infrastructure/prisma/repository-bindings.module';

import { StorageService } from './storage.service';


import { StorageController } from './storage.controller';


@Module({


  imports: [RepositoryBindingsModule],




  controllers: [StorageController],







  providers: [StorageService],






})

export class StorageModule {}
