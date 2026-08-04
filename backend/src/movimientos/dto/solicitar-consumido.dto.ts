import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class FechaSolicitadaDto {
  @ApiProperty()
  @IsDateString()
  fecha: string;

  @ApiProperty({ description: 'true si este es el dia del medio franco' })
  @IsBoolean()
  esMedio: boolean;

  @ApiProperty({ enum: ['man', 'tar'], required: false })
  @IsOptional()
  @IsIn(['man', 'tar'])
  turno?: 'man' | 'tar' | null;
}

export class SolicitarConsumidoDto {
  @ApiProperty({ description: 'Cantidad total, multiplo de 0.5 (ej: 0.5, 1, 1.5, 2)' })
  @IsNumber()
  @Min(0.5)
  cantidad: number;

  @ApiProperty({
    type: [FechaSolicitadaDto],
    description: 'Un dia por cada franco entero, ninguno puede ser sabado ni domingo',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FechaSolicitadaDto)
  fechas: FechaSolicitadaDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comentario?: string;
}
