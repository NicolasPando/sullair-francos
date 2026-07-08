import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class SolicitarConsumidoDto {
  @ApiProperty({ description: 'Fecha en la que se quiere tomar el franco' })
  @IsDateString()
  fechaDeseada: string;

  @ApiProperty({ example: 'Manana', required: false })
  @IsOptional()
  @IsString()
  turno?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comentario?: string;
}
