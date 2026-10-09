import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoTransferencia, Transferencia } from '../entities/transferencia.entity';

/** Representación de una transferencia devuelta a los canales digitales. */
export class RespuestaTransferenciaDto {
  @ApiProperty({ example: '4d3f2c1b-8a7e-4f6d-9c0b-1e2f3a4b5c6d' })
  id!: string;

  @ApiProperty({ example: '1000123456' })
  cuentaOrigen!: string;

  @ApiProperty({ example: '2000654321' })
  cuentaDestino!: string;

  @ApiProperty({ example: 250000 })
  monto!: number;

  @ApiProperty({ example: 'Transferencia interbancaria' })
  concepto!: string;

  @ApiProperty({ enum: EstadoTransferencia, example: EstadoTransferencia.PROCESADA })
  estado!: EstadoTransferencia;

  @ApiProperty({ description: 'Mensaje descriptivo del resultado de la operación.' })
  mensaje!: string;

  @ApiProperty({ example: '2026-10-01T12:00:00.000Z' })
  fechaCreacion!: string;

  @ApiPropertyOptional({ example: '2026-10-01T12:00:00.120Z', nullable: true })
  fechaProceso!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true, description: 'Código de rechazo del núcleo, si aplica.' })
  codigoError!: string | null;

  static desde(transferencia: Transferencia): RespuestaTransferenciaDto {
    return {
      id: transferencia.id,
      cuentaOrigen: transferencia.cuentaOrigen,
      cuentaDestino: transferencia.cuentaDestino,
      monto: transferencia.monto,
      concepto: transferencia.concepto,
      estado: transferencia.estado,
      mensaje:
        transferencia.estado === EstadoTransferencia.PROCESADA
          ? 'Transferencia procesada correctamente.'
          : 'La transferencia fue rechazada por el núcleo transaccional.',
      fechaCreacion: transferencia.fechaCreacion,
      fechaProceso: transferencia.fechaProceso,
      codigoError: transferencia.codigoError,
    };
  }
}

/** Listado de transferencias. */
export class ListaTransferenciasResponseDto {
  @ApiProperty({ example: 2 })
  total!: number;

  @ApiProperty({ type: [RespuestaTransferenciaDto] })
  transferencias!: RespuestaTransferenciaDto[];

  static desde(transferencias: Transferencia[]): ListaTransferenciasResponseDto {
    return {
      total: transferencias.length,
      transferencias: transferencias.map((transferencia) => RespuestaTransferenciaDto.desde(transferencia)),
    };
  }
}
