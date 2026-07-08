import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuario } from './entities/usuario.entity';
import { Sector } from '../entities/sector.entity';
import { RolesEnum } from './entities/roles.enum';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosRepository {
  constructor(
    @InjectRepository(Usuario) private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Sector) private readonly sectorRepository: Repository<Sector>,
  ) {}

  findAll(rol?: RolesEnum.ADMIN | RolesEnum.ENCARGADO) {
    return this.usuarioRepository.find({ where: rol ? { rol } : {}, order: { nombre: 'ASC' } });
  }

  async create(dto: CreateUsuarioDto) {
    let sector: Sector | null = null;
    if (dto.rol === RolesEnum.ENCARGADO) {
      if (!dto.sectorId) throw new BadRequestException('El encargado necesita un sector');
      sector = await this.sectorRepository.findOne({ where: { id: dto.sectorId } });
      if (!sector) throw new NotFoundException('Sector no encontrado');
    }

    const nombreExistente = await this.usuarioRepository.findOne({ where: { nombre: dto.nombre.trim() } });
    if (nombreExistente) throw new ConflictException('Ya existe un usuario con ese nombre. Usa nombre y apellido para diferenciarlos.');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.usuarioRepository.save(
      this.usuarioRepository.create({ nombre: dto.nombre, rol: dto.rol, sector, passwordHash }),
    );
  }

  async update(id: string, dto: UpdateUsuarioDto) {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    if (dto.nombre) usuario.nombre = dto.nombre;
    if (dto.sectorId) {
      const sector = await this.sectorRepository.findOne({ where: { id: dto.sectorId } });
      if (!sector) throw new NotFoundException('Sector no encontrado');
      usuario.sector = sector;
    }
    if (dto.password) usuario.passwordHash = await bcrypt.hash(dto.password, 10);

    return this.usuarioRepository.save(usuario);
  }

  async remove(id: string) {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    if (usuario.rol === RolesEnum.ADMIN) {
      const totalAdmins = await this.usuarioRepository.count({ where: { rol: RolesEnum.ADMIN } });
      if (totalAdmins <= 1) throw new ConflictException('No se puede eliminar al unico admin');
    }

    await this.usuarioRepository.remove(usuario);
    return { message: 'Usuario eliminado' };
  }
}
