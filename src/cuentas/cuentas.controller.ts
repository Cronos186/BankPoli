import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { RolUsuario } from '../auth/entities/usuario.entity';
import { CuentasService } from './cuentas.service';
import { ConsultaSaldoParamsDto } from './dto/consulta-saldo.dto';
import { SaldoResponseDto } from './dto/saldo-response.dto';

@ApiTags('Cuentas')
@ApiBearerAuth('JWT')
@Controller('cuentas')
export class CuentasController {
  constructor(private readonly cuentasService: CuentasService) {}

  @Get(':numero/saldo')
  @Roles(RolUsuario.CLIENTE, RolUsuario.CAJERO, RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Consultar el saldo disponible de una cuenta',
    description:
      'Devuelve el estado y el saldo disponible de la cuenta consultada. La información proviene del núcleo transaccional a través del Legacy Wrapper.',
  })
  @ApiOkResponse({ description: 'Cuenta consultada correctamente.', type: SaldoResponseDto })
  @ApiNotFoundResponse({ description: 'La cuenta no existe.', type: ErrorResponseDto })
  async consultarSaldo(@Param() parametros: ConsultaSaldoParamsDto): Promise<SaldoResponseDto> {
    const cuenta = await this.cuentasService.consultarCuenta(parametros.numero);
    return SaldoResponseDto.desde(cuenta);
  }
}
