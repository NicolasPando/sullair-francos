import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuario } from './entities/usuario.entity';
import { Sector } from '../entities/sector.entity';
import { RolesEnum } from './entities/roles.enum';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosRepository implements OnModuleInit {
  private readonly logger = new Logger(UsuariosRepository.name);

  constructor(
    @InjectRepository(Usuario) private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Sector) private readonly sectorRepository: Repository<Sector>,
  ) {}

  // Migracion de datos (idempotente): los encargados que tenian un unico `sector` (modelo anterior)
  // pasan a tenerlo tambien en `sectores`. Si ya tienen sectores asignados no se toca nada.
  async onModuleInit() {
    const encargados = await this.usuarioRepository.find({ where: { rol: RolesEnum.ENCARGADO } });
    for (const e of encargados) {
      if (e.sector && (!e.sectores || e.sectores.length === 0)) {
        e.sectores = [e.sector];
        await this.usuarioRepository.save(e);
        this.logger.log(`Encargado "${e.nombre}": sector "${e.sector.nombre}" migrado a sectores`);
      }
    }
  }

  findAll(rol?: RolesEnum.ADMIN | RolesEnum.ENCARGADO) {
    return this.usuarioRepository.find({ where: rol ? { rol } : {}, order: { nombre: 'ASC' } });
  }

  // Valida que existan todos los sectores pedidos y los devuelve
  private async buscarSectores(sectorIds: string[]): Promise<Sector[]> {
    const unicos = [...new Set(sectorIds)];
    const sectores = await this.sectorRepository.find({ where: { id: In(unicos) } });
    if (sectores.length !== unicos.length) throw new NotFoundException('Algun sector no existe');
    return sectores;
  }

  async create(dto: CreateUsuarioDto) {
    let sectores: Sector[] = [];
    if (dto.rol === RolesEnum.ENCARGADO) {
      if (!dto.sectorIds?.length) throw new BadRequestException('El encargado necesita al menos un sector');
      sectores = await this.buscarSectores(dto.sectorIds);
    }

    const nombreExistente = await this.usuarioRepository.findOne({ where: { nombre: dto.nombre.trim() } });
    if (nombreExistente) throw new ConflictException('Ya existe un usuario con ese nombre. Usa nombre y apellido para diferenciarlos.');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.usuarioRepository.save(
      this.usuarioRepository.create({
        nombre: dto.nombre,
        rol: dto.rol,
        sectores,
        sector: sectores[0] ?? null, // columna deprecada, se mantiene sincronizada con el primer sector
        passwordHash,
      }),
    );
  }

  async update(id: string, dto: UpdateUsuarioDto) {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    if (dto.nombre) usuario.nombre = dto.nombre;
    if (dto.sectorIds && usuario.rol === RolesEnum.ENCARGADO) {
      if (dto.sectorIds.length === 0) throw new BadRequestException('El encargado necesita al menos un sector');
      usuario.sectores = await this.buscarSectores(dto.sectorIds);
      usuario.sector = usuario.sectores[0];
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
