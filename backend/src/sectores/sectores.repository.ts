import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sector } from '../entities/sector.entity';
import { Tecnico } from '../tecnicos/tecnico.entity';
import { CreateSectorDto } from './dto/create-sector.dto';

@Injectable()
export class SectoresRepository {
  constructor(
    @InjectRepository(Sector) private readonly sectorRepository: Repository<Sector>,
    @InjectRepository(Tecnico) private readonly tecnicoRepository: Repository<Tecnico>,
  ) {}

  findAll() {
    return this.sectorRepository.find({ order: { nombre: 'ASC' } });
  }

  async create(dto: CreateSectorDto) {
    const existente = await this.sectorRepository.findOne({ where: { nombre: dto.nombre } });
    if (existente) throw new ConflictException('Ya existe un sector con ese nombre');
    return this.sectorRepository.save(this.sectorRepository.create(dto));
  }

  async remove(id: string) {
    const sector = await this.sectorRepository.findOne({ where: { id } });
    if (!sector) throw new NotFoundException('Sector no encontrado');

    const tecnicosActivos = await this.tecnicoRepository.count({
      where: { sector: { id }, activo: true },
    });
    if (tecnicosActivos > 0) {
      throw new BadRequestException('No se puede eliminar un sector con tecnicos activos');
    }

    await this.sectorRepository.remove(sector);
    return { message: 'Sector eliminado' };
  }
}
