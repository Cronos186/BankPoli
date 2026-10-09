import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { LegacyAdapterService } from './transferencias/legacy-adapter.service';

/** Respuesta del chequeo de estado de la API. */
export class EstadoServicioDto {
  estado!: string;
  servicio!: string;
  version!: string;
  motorNucleo!: string;
  timestamp!: string;
}

@ApiTags('Estado del servicio')
@Controller('health')
export class AppController {
  constructor(private readonly adapter: LegacyAdapterService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar la disponibilidad de la API',
    description:
      'Recurso público que permite comprobar que la API está en ejecución e informa qué implementación del núcleo transaccional está siendo envuelta por el Legacy Wrapper.',
  })
  @ApiOkResponse({ description: 'Servicio disponible.', type: EstadoServicioDto })
  estado(): EstadoServicioDto {
    return {
      estado: 'UP',
      servicio: 'bankpoli-transferencias-api',
      version: '1.0.0',
      motorNucleo: this.adapter.motorCore,
      timestamp: new Date().toISOString(),
    };
  }
}
