import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUsuarioDto {
  @ApiProperty({ description: 'Nombre completo del encargado o admin, tal como fue cargado' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
