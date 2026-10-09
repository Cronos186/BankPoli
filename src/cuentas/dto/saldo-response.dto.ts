import { ApiProperty } from '@nestjs/swagger';
import { Cuenta, EstadoCuenta } from '../entities/cuenta.entity';

/** Representación de una cuenta y su saldo disponible. */
export class SaldoResponseDto {
  @ApiProperty({ example: '1000123456' })
  numero!: string;

  @ApiProperty({ example: 'Ana Maria Cliente' })
  titular!: string;

  @ApiProperty({ example: 'AHORROS' })
  tipo!: string;

  @ApiProperty({ example: 'COP' })
  moneda!: string;

  @ApiProperty({ description: 'Saldo actual de la cuenta.', example: 2500000 })
  saldo!: number;

  @ApiProperty({ enum: EstadoCuenta, example: EstadoCuenta.ACTIVA })
  estado!: EstadoCuenta;

  @ApiProperty({
    description: 'Indica si la cuenta puede usarse como origen de una transferencia.',
    example: true,
  })
  disponible!: boolean;

  static desde(cuenta: Cuenta): SaldoResponseDto {
    return {
      numero: cuenta.numero,
      titular: cuenta.titular,
      tipo: cuenta.tipo,
      moneda: cuenta.moneda,
      saldo: cuenta.saldo,
      estado: cuenta.estado,
      disponible: cuenta.activa,
    };
  }
}
