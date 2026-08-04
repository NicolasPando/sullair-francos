import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class DeclararGeneradoDto {
  @ApiProperty({ description: 'Fecha trabajada. Tiene que ser sabado o domingo.' })
  @IsDateString()
  fechaTrabajo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comentario?: string;
}
