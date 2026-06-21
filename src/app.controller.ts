import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Public()
  @Get()
   @ApiOperation({ 
      summary: 'Point d\'entrée de l\'API SP-SERVICES',
      description: 'Retourne les détails d\'une unité spécifique via son UUID.'
    })
  getHello(): string {
    return this.appService.getHello();
  }
}
