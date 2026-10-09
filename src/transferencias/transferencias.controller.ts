import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { RolUsuario } from '../auth/entities/usuario.entity';
import { UsuarioAutenticado } from '../auth/interfaces/usuario-autenticado.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { CrearTransferenciaDto } from './dto/crear-transferencia.dto';
import { ConsultaTransferenciaParamsDto, ListarTransferenciasQueryDto } from './dto/consulta-transferencia.dto';
import { ListaTransferenciasResponseDto, RespuestaTransferenciaDto } from './dto/respuesta-transferencia.dto';
import { TransferenciasService } from './transferencias.service';

@ApiTags('Transferencias')
@ApiBearerAuth('JWT')
@Controller('transferencias')
export class TransferenciasController {
  constructor(private readonly transferenciasService: TransferenciasService) {}

  @Post()
  @Roles(RolUsuario.CLIENTE, RolUsuario.CAJERO)
  @ApiOperation({
    summary: 'Crear y procesar una transferencia interbancaria',
    description:
      'Valida la solicitud, verifica las cuentas y el saldo disponible, y ejecuta la operación en el núcleo transaccional a través del Legacy Wrapper. El consumidor no necesita conocer las estructuras internas del sistema heredado.',
  })
  @ApiCreatedResponse({ description: 'Transferencia creada y procesada.', type: RespuestaTransferenciaDto })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos o cuentas iguales.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Alguna de las cuentas no existe.', type: ErrorResponseDto })
  @ApiConflictResponse({ description: 'Saldo insuficiente.', type: ErrorResponseDto })
  @ApiUnprocessableEntityResponse({ description: 'Alguna de las cuentas no está activa.', type: ErrorResponseDto })
  async crear(
    @Body() dto: CrearTransferenciaDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<RespuestaTransferenciaDto> {
    const transferencia = await this.transferenciasService.crear(dto, usuario);
    return RespuestaTransferenciaDto.desde(transferencia);
  }

  @Get()
  @Roles(RolUsuario.CLIENTE, RolUsuario.CAJERO, RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Listar transferencias',
    description:
      'Devuelve las transferencias registradas. Un usuario CLIENTE solo puede consultar las de su cuenta principal; CAJERO y ADMINISTRADOR pueden filtrar por cualquier cuenta.',
  })
  @ApiOkResponse({ description: 'Listado de transferencias.', type: ListaTransferenciasResponseDto })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos sobre la cuenta consultada.',
    type: ErrorResponseDto,
  })
  async listar(
    @Query() filtros: ListarTransferenciasQueryDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<ListaTransferenciasResponseDto> {
    const transferencias = await this.transferenciasService.listar(usuario, filtros);
    return ListaTransferenciasResponseDto.desde(transferencias);
  }

  @Get(':id')
  @Roles(RolUsuario.CLIENTE, RolUsuario.CAJERO, RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Consultar el estado de una transferencia',
    description: 'Devuelve la información registrada por el núcleo transaccional para la transferencia indicada.',
  })
  @ApiOkResponse({ description: 'Transferencia encontrada.', type: RespuestaTransferenciaDto })
  @ApiNotFoundResponse({ description: 'La transferencia no existe.', type: ErrorResponseDto })
  @ApiForbiddenResponse({
    description: 'El usuario no participa en la transferencia consultada.',
    type: ErrorResponseDto,
  })
  async obtener(
    @Param() parametros: ConsultaTransferenciaParamsDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<RespuestaTransferenciaDto> {
    const transferencia = await this.transferenciasService.obtener(parametros.id, usuario);
    return RespuestaTransferenciaDto.desde(transferencia);
  }
}
