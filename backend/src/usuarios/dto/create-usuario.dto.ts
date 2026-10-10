import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { RolesEnum } from './../entities/roles.enum';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Ana Gomez' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ enum: [RolesEnum.ADMIN, RolesEnum.ENCARGADO] })
  @IsEnum(RolesEnum)
  rol: RolesEnum.ADMIN | RolesEnum.ENCARGADO;

  @ApiProperty({ description: 'Sectores a cargo. Requerido (al menos uno) si el rol es encargado', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  sectorIds?: string[];

  @ApiProperty()
  @IsString()
  @MinLength(4)
  password: string;
}
