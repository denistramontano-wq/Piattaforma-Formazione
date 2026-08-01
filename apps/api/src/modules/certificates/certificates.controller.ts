import { Controller, Get, Param } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { Public } from '../auth/public.decorator';

@Controller()
export class CertificatesController {
  constructor(private readonly service: CertificatesService) {}

  @Get('me/certificates')
  mine() {
    return this.service.myCertificates();
  }

  // Pubblico: un certificato deve poter essere verificato anche da chi non ha un account
  // sulla piattaforma (es. un datore di lavoro che controlla l'autenticità).
  @Public()
  @Get('certificates/:code/verify')
  verify(@Param('code') code: string) {
    return this.service.verify(code);
  }
}
