import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** Parametros de ruta para consultar una transferencia. */
export class ConsultaTransferenciaParamsDto {
  @ApiProperty({
    description: 'Identificador único de la transferencia.',
    example: '4d3f2c1b-8a7e-4f6d-9c0b-1e2f3a4b5c6d',
  })
  @Matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, {
    message: 'El identificador de la transferencia no tiene un formato válido.',
  })
  id!: string;
}

/** Filtros admitidos al listar transferencias. */
export class ListarTransferenciasQueryDto {
  @ApiPropertyOptional({
    description: 'Número de cuenta por el cual filtrar. Un usuario CLIENTE solo puede consultar su cuenta principal.',
    example: '1000123456',
  })
  @IsOptional()
  @Matches(/^\d{10}$/, { message: 'La cuenta debe contener exactamente 10 dígitos.' })
  cuenta?: string;

  @ApiPropertyOptional({ description: 'Cantidad máxima de resultados.', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero.' })
  @Min(1, { message: 'El límite mínimo es 1.' })
  @Max(100, { message: 'El límite máximo es 100.' })
  limite?: number;
}
