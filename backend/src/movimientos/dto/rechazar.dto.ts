import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RechazarDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  motivoRechazo: string;
}
