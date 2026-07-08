import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class AjusteDto {
  @ApiProperty()
  @IsUUID()
  tecnicoId: string;

  @ApiProperty({ description: 'Puede ser negativo' })
  @IsNumber()
  cantidad: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  motivoAjuste: string;
}
