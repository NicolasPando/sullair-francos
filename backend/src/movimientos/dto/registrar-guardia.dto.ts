import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class RegistrarGuardiaDto {
  @ApiProperty()
  @IsDateString()
  guardiaDesde: string;

  @ApiProperty()
  @IsDateString()
  guardiaHasta: string;

  @ApiProperty({ description: 'Cantidad de francos que genera la guardia' })
  @IsNumber()
  @Min(0)
  cantidad: number;

  @ApiProperty({
    description: 'Detalle dia por dia (activo/desde/hasta), igual al que arma el front',
    required: false,
  })
  @IsOptional()
  @IsObject()
  guardiaDias?: Record<string, { activo: boolean; desde?: string; hasta?: string }>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  guardiaNovedades?: string;
}
