import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Tecnico } from '../tecnicos/tecnico.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Sector } from '../entities/sector.entity';
import { RolesEnum } from '../usuarios/entities/roles.enum';
import { LoginTecnicoDto } from './dto/login-tecnico.dto';
import { LoginUsuarioDto } from './dto/login-usuario.dto';
import { SetupDto } from './dto/setup.dto';

const SECTORES_POR_DEFECTO = ['Altura', 'Compresores'];

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tecnico) private readonly tecnicoRepository: Repository<Tecnico>,
    @InjectRepository(Usuario) private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Sector) private readonly sectorRepository: Repository<Sector>,
    private readonly jwtService: JwtService,
  ) {}

  // Chequea si ya se hizo la configuracion inicial (existe al menos un admin)
  async setupPendiente(): Promise<boolean> {
    const admins = await this.usuarioRepository.count({ where: { rol: RolesEnum.ADMIN } });
    return admins === 0;
  }

  // Opciones publicas para armar los selectores de login (sin passwords ni pinHash)
  async opciones() {
    const [tecnicos, usuarios, sectores] = await Promise.all([
      this.tecnicoRepository.find({ where: { activo: true } }),
      this.usuarioRepository.find(),
      this.sectorRepository.find(),
    ]);

    return {
      setupPendiente: await this.setupPendiente(),
      sectores: sectores.map((s) => ({ id: s.id, nombre: s.nombre })),
      tecnicos: tecnicos.map((t) => ({
        id: t.id,
        nombre: t.nombre,
        sector: t.sector?.nombre,
        requierePin: !!t.pinHash,
      })),
      encargados: usuarios
        .filter((u) => u.rol === RolesEnum.ENCARGADO)
        .map((u) => ({ id: u.id, nombre: u.nombre, sector: u.sector?.nombre })),
      admins: usuarios
        .filter((u) => u.rol === RolesEnum.ADMIN)
        .map((u) => ({ id: u.id, nombre: u.nombre })),
    };
  }

  async setup(setupDto: SetupDto) {
    if (!(await this.setupPendiente())) {
      throw new ConflictException('La configuracion inicial ya fue realizada');
    }

    for (const nombre of SECTORES_POR_DEFECTO) {
      const existente = await this.sectorRepository.findOne({ where: { nombre } });
      if (!existente) await this.sectorRepository.save(this.sectorRepository.create({ nombre }));
    }

    const passwordHash = await bcrypt.hash(setupDto.password, 10);
    const admin = await this.usuarioRepository.save(
      this.usuarioRepository.create({
        nombre: setupDto.nombre,
        rol: RolesEnum.ADMIN,
        passwordHash,
        sector: null,
      }),
    );

    return this.firmarToken(admin.id, RolesEnum.ADMIN, admin.nombre, null);
  }

  async loginTecnico(dto: LoginTecnicoDto) {
    const tecnico = await this.tecnicoRepository.findOne({
      where: { id: dto.tecnicoId, activo: true },
    });
    if (!tecnico) throw new BadRequestException('Tecnico invalido');

    if (tecnico.pinHash) {
      if (!dto.pin) throw new BadRequestException('Este tecnico requiere PIN');
      const pinOk = await bcrypt.compare(dto.pin, tecnico.pinHash);
      if (!pinOk) throw new UnauthorizedException('PIN incorrecto');
    }

    return this.firmarToken(tecnico.id, RolesEnum.TECNICO, tecnico.nombre, tecnico.sector?.id);
  }

  async loginUsuario(dto: LoginUsuarioDto) {
    const usuario = await this.usuarioRepository.findOne({ where: { id: dto.usuarioId } });
    if (!usuario) throw new BadRequestException('Usuario invalido');

    const passwordOk = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordOk) throw new UnauthorizedException('Contrasena incorrecta');

    return this.firmarToken(usuario.id, usuario.rol, usuario.nombre, usuario.sector?.id ?? null);
  }

  private firmarToken(sub: string, rol: RolesEnum, nombre: string, sectorId?: string | null) {
    const payload = { sub, rol, nombre, sectorId: sectorId ?? null };
    const token = this.jwtService.sign(payload);
    return { token, user: payload };
  }
}
