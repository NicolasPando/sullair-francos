import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateUsuarioDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ required: false, type: [String], description: 'Reemplaza los sectores a cargo del encargado' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  sectorIds?: string[];

  @ApiProperty({ description: 'Vacio = no cambiar', required: false })
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}
