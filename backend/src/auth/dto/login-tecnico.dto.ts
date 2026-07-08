import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginTecnicoDto {
  @ApiProperty({ description: 'Nombre completo del tecnico, tal como fue cargado por el admin' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'PIN de 4 digitos, si el tecnico tiene uno configurado', required: false })
  @IsOptional()
  @IsString()
  pin?: string;
}
