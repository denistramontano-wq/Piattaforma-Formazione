import { Controller, Get, Param } from '@nestjs/common';
import { CertificatesService } from './certificates.service';

@Controller()
export class CertificatesController {
  constructor(private readonly service: CertificatesService) {}

  @Get('me/certificates')
  mine() {
    return this.service.myCertificates();
  }

  @Get('certificates/:code/verify')
  verify(@Param('code') code: string) {
    return this.service.verify(code);
  }
}
