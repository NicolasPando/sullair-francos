import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeclararGeneradoDto {
  @ApiProperty({ description: 'Fecha del dia libre que se trabajo' })
  @IsDateString()
  fechaTrabajo: string;

  @ApiProperty({ example: 'Sabado', required: false })
  @IsOptional()
  @IsString()
  diaTrabajado?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comentario?: string;
}
