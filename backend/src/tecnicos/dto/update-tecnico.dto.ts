import { PartialType } from '@nestjs/swagger';
import { CreateTecnicoDto } from './create-tecnico.dto';

export class UpdateTecnicoDto extends PartialType(CreateTecnicoDto) {}
