import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class LoginTecnicoDto {
  @ApiProperty({ description: 'id del tecnico elegido en el selector' })
  @IsUUID()
  @IsNotEmpty()
  tecnicoId: string;

  @ApiProperty({ description: 'PIN de 4 digitos, si el tecnico tiene uno configurado', required: false })
  @IsOptional()
  @IsString()
  pin?: string;
}
