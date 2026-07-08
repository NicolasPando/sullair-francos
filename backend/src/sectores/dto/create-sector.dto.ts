import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSectorDto {
  @ApiProperty({ example: 'Generadores' })
  @IsString()
  @IsNotEmpty()
  nombre: string;
}
