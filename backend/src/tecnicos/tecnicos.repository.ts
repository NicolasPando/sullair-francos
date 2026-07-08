import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Tecnico } from './tecnico.entity';
import { Sector } from '../entities/sector.entity';
import { CreateTecnicoDto } from './dto/create-tecnico.dto';
import { UpdateTecnicoDto } from './dto/update-tecnico.dto';

@Injectable()
export class TecnicosRepository {
  constructor(
    @InjectRepository(Tecnico) private readonly tecnicoRepository: Repository<Tecnico>,
    @InjectRepository(Sector) private readonly sectorRepository: Repository<Sector>,
  ) {}

  findAll() {
    return this.tecnicoRepository.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: string) {
    const tecnico = await this.tecnicoRepository.findOne({ where: { id } });
    if (!tecnico) throw new NotFoundException('Tecnico no encontrado');
    return tecnico;
  }

  async create(dto: CreateTecnicoDto) {
    const sector = await this.sectorRepository.findOne({ where: { id: dto.sectorId } });
    if (!sector) throw new NotFoundException('Sector no encontrado');

    const pinHash = dto.pin ? await bcrypt.hash(dto.pin, 10) : null;

    return this.tecnicoRepository.save(
      this.tecnicoRepository.create({ nombre: dto.nombre, sector, pinHash }),
    );
  }

  async update(id: string, dto: UpdateTecnicoDto) {
    const tecnico = await this.findOne(id);

    if (dto.nombre) tecnico.nombre = dto.nombre;
    if (dto.sectorId) {
      const sector = await this.sectorRepository.findOne({ where: { id: dto.sectorId } });
      if (!sector) throw new NotFoundException('Sector no encontrado');
      tecnico.sector = sector;
    }
    if (dto.pin !== undefined) {
      tecnico.pinHash = dto.pin ? await bcrypt.hash(dto.pin, 10) : null;
    }

    return this.tecnicoRepository.save(tecnico);
  }

  async toggleActivo(id: string) {
    const tecnico = await this.findOne(id);
    tecnico.activo = !tecnico.activo;
    return this.tecnicoRepository.save(tecnico);
  }
}
