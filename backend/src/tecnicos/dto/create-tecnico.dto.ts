import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateTecnicoDto {
  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'id del sector' })
  @IsUUID()
  sectorId: string;

  @ApiProperty({ description: 'PIN de 4 digitos, opcional', required: false })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  pin?: string;
}
