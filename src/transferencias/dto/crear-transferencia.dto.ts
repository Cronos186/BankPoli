import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

/** Monto maximo permitido por operacion (regla de negocio academica). */
export const MONTO_MAXIMO_TRANSFERENCIA = 999999999.99;

/** Representación enviada por los canales digitales para crear una transferencia. */
export class CrearTransferenciaDto {
  @ApiProperty({
    description: 'Número de la cuenta desde la cual se debita el valor.',
    example: '1000123456',
    pattern: '^\\d{10}$',
  })
  @IsString({ message: 'La cuenta de origen debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La cuenta de origen es obligatoria.' })
  @Matches(/^\d{10}$/, { message: 'La cuenta de origen debe contener exactamente 10 dígitos.' })
  cuentaOrigen!: string;

  @ApiProperty({
    description: 'Número de la cuenta a la cual se acredita el valor.',
    example: '2000654321',
    pattern: '^\\d{10}$',
  })
  @IsString({ message: 'La cuenta de destino debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La cuenta de destino es obligatoria.' })
  @Matches(/^\d{10}$/, { message: 'La cuenta de destino debe contener exactamente 10 dígitos.' })
  cuentaDestino!: string;

  @ApiProperty({
    description: 'Valor de la transferencia en la moneda de la cuenta (COP).',
    example: 250000,
    minimum: 1,
    maximum: MONTO_MAXIMO_TRANSFERENCIA,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número con máximo dos decimales.' })
  @IsPositive({ message: 'El monto debe ser mayor que cero.' })
  @Min(1, { message: 'El monto mínimo por transferencia es 1.' })
  @Max(MONTO_MAXIMO_TRANSFERENCIA, {
    message: `El monto no puede superar ${MONTO_MAXIMO_TRANSFERENCIA}.`,
  })
  monto!: number;

  @ApiProperty({
    description: 'Descripción de la operación.',
    example: 'Transferencia interbancaria',
    maxLength: 140,
  })
  @IsString({ message: 'El concepto debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El concepto es obligatorio.' })
  @MaxLength(140, { message: 'El concepto no puede superar los 140 caracteres.' })
  concepto!: string;
}
