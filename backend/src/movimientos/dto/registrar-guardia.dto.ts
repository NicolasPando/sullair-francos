import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class DiaGuardiaDto {
  @ApiProperty()
  @IsDateString()
  fecha: string;

  @ApiProperty()
  @IsBoolean()
  convocado: boolean;

  @ApiProperty({ required: false, description: 'HH:MM, requerido si convocado=true' })
  @IsOptional()
  @IsString()
  inicio?: string | null;

  @ApiProperty({ required: false, description: 'HH:MM, requerido si convocado=true' })
  @IsOptional()
  @IsString()
  fin?: string | null;
}

export class RegistrarGuardiaDto {
  @ApiProperty()
  @IsDateString()
  guardiaDesde: string;

  @ApiProperty()
  @IsDateString()
  guardiaHasta: string;

  @ApiProperty({ type: [DiaGuardiaDto], description: 'Un registro por cada dia del periodo (maximo 7 dias)' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => DiaGuardiaDto)
  guardiaDias: DiaGuardiaDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  guardiaNovedades?: string;
}
