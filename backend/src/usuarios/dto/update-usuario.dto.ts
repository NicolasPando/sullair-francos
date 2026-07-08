import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateUsuarioDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  sectorId?: string;

  @ApiProperty({ description: 'Vacio = no cambiar', required: false })
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}
