import { Injectable, ConflictException } from '@nestjs/common';

import { AssistantAggregate } from '../../../domain/entities/base-user.abstract';

import { IAssistantRepository } from '../../../domain/ports/assistant-repository.port';

import { AssistantRole } from '@prisma/client';

import { PrismaService } from '../prisma.service';



@Injectable()

export class PrismaAssistantRepository implements IAssistantRepository {

  constructor(private readonly prisma: PrismaService) {}



  async findAggregateByUserId(userId: string) {

    const row = await this.prisma.assistant.findUnique({

      where: { userId },

      include: { user: true },

    });

    if (!row?.user || row.user.deletedAt != null) return null;



    return AssistantAggregate.fromJoined({

      user: row.user,

      assistant: { id: row.id, role: row.role as AssistantRole },

    });



  }





  async createProfile(input: { userId: string; role: AssistantRole }) {





    try {





      const created = await this.prisma.assistant.create({





        data: {





          userId: input.userId,





          role: input.role as AssistantRole,





        },





        include: { user: true },





      });



      return AssistantAggregate.fromJoined({

        user: created.user,



        assistant: { id: created.id, role: created.role },



      });



    } catch (e: any) {

      if (e?.code === 'P2002') {

        throw new ConflictException('Assistant profile already exists');

      }





      throw e;





    }





  }





}



