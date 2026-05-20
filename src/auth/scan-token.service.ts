import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ScanTokenService {
  constructor(private readonly config: ConfigService) {}

  private secret() {
    const s = this.config.get<string>('jwtScanSecret');
    if (!s) {
      throw new Error('jwtScanSecret is not configured');
    }
    return s;
  }

  /** Short-lived bearer token assistants scan from the student's QR payload. */

  mintAttendanceCheckQrToken(checkId: string, expiresIn: jwt.SignOptions['expiresIn'] = '2h') {
    const secret = this.secret();
    return jwt.sign({ typ: 'attendance_scan', cid: checkId }, secret, {
      expiresIn,
    });
  }

  extractCheckId(token: string): string {
    const secret = this.secret();
    const payload = jwt.verify(token, secret) as { cid?: string; typ?: string };
    if (payload?.typ !== 'attendance_scan' || !payload.cid) {
      throw new Error('Bad scan token');
    }
    return payload.cid;
  }
}
