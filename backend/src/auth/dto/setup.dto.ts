import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SetupDto {
  @ApiProperty({ example: 'Mauro Palazzo' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  password: string;
}
