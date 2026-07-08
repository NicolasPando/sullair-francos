import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class LoginUsuarioDto {
  @ApiProperty({ description: 'id del encargado o admin elegido en el selector' })
  @IsUUID()
  @IsNotEmpty()
  usuarioId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
