import { Injectable } from '@nestjs/common';
import { TecnicosRepository } from './tecnicos.repository';
import { CreateTecnicoDto } from './dto/create-tecnico.dto';
import { UpdateTecnicoDto } from './dto/update-tecnico.dto';

@Injectable()
export class TecnicosService {
  constructor(private readonly tecnicosRepository: TecnicosRepository) {}

  findAll() {
    return this.tecnicosRepository.findAll();
  }

  findOne(id: string) {
    return this.tecnicosRepository.findOne(id);
  }

  create(dto: CreateTecnicoDto) {
    return this.tecnicosRepository.create(dto);
  }

  update(id: string, dto: UpdateTecnicoDto) {
    return this.tecnicosRepository.update(id, dto);
  }

  toggleActivo(id: string) {
    return this.tecnicosRepository.toggleActivo(id);
  }
}
