import { Module } from '@nestjs/common';
import { RepositoryBindingsModule } from '../infrastructure/prisma/repository-bindings.module';

import { SectionsController } from './sections.controller';


import { SectionsService } from './sections.service';


import { GroupsService } from './groups.service';


import { AssistantshipsService } from './assistantships.service';


import { GroupEnrollerDomain } from '../domain/services/group-enroller.domain';

@Module({


  imports: [RepositoryBindingsModule],





  controllers: [SectionsController],





  providers: [


    SectionsService,


    GroupsService,


    AssistantshipsService,

    GroupEnrollerDomain,

  ],

})

export class CampusModule {}
