import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPrincipal } from '../auth/auth.types';
import type { IAttendanceCheckRepository } from '../domain/ports/student-and-attendance.ports';
import type { IAssistantRepository } from '../domain/ports/assistant-repository.port';
import {
  ASSISTANT_REPOSITORY,
  ATTENDANCE_CHECK_REPOSITORY,
} from '../domain/tokens/injection.tokens';
import { ScanTokenService } from '../auth/scan-token.service';

@Injectable()

export class AttendanceFlowsService {
  constructor(
    private readonly scans: ScanTokenService,

    @Inject(ATTENDANCE_CHECK_REPOSITORY)



    private readonly checks: IAttendanceCheckRepository,

    @Inject(ASSISTANT_REPOSITORY)


    private readonly assistants: IAssistantRepository,

  ) {}




  async previewFromStudentQr(tokenRaw: string) {



    let checkId: string;

    try {
      checkId = this.scans.extractCheckId(tokenRaw);

    } catch {

      throw new ForbiddenException('Invalid scan token');


    }



    const preview = await this.checks.getAssistantPreview(checkId);



    if (!preview) {


      throw new NotFoundException('Preview not available');


    }



    return preview;


  }



  async decide(user: JwtPrincipal, checkId: string, approve: boolean) {



    const asAssistant = await this.assistants.findAggregateByUserId(user.sub);



    if (!asAssistant || !user.personas.includes('ASSISTANT')) {


      throw new ForbiddenException('Assistant required');


    }



    return this.checks.markDecision({


      checkId,



      approve,



      assistantAssistantId: asAssistant.assistantId,


    });



  }



  async dashboard(assistantshipId: string) {



    return this.checks.dashboard(assistantshipId);


  }



}

