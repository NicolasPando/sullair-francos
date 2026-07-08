import { Injectable } from '@nestjs/common';
import { SectoresRepository } from './sectores.repository';
import { CreateSectorDto } from './dto/create-sector.dto';

@Injectable()
export class SectoresService {
  constructor(private readonly sectoresRepository: SectoresRepository) {}

  findAll() {
    return this.sectoresRepository.findAll();
  }

  create(dto: CreateSectorDto) {
    return this.sectoresRepository.create(dto);
  }

  remove(id: string) {
    return this.sectoresRepository.remove(id);
  }
}
