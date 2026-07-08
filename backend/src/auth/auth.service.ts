import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ILike, Repository } from 'typeorm';
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

  // Endpoint publico: NO devuelve listas de nombres ni de cuentas, solo si falta
  // hacer la configuracion inicial. El login es siempre escribiendo el nombre a mano.
  async opciones() {
    return { setupPendiente: await this.setupPendiente() };
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
    const nombre = dto.nombre.trim();
    const tecnico = await this.tecnicoRepository.findOne({
      where: { nombre: ILike(nombre), activo: true },
    });

    // mensaje generico: no distinguimos "no existe" de "PIN incorrecto"
    // para no permitir que alguien adivine que nombres estan cargados
    const credencialesInvalidas = () => new UnauthorizedException('Nombre o PIN incorrectos');

    if (!tecnico) throw credencialesInvalidas();

    if (tecnico.pinHash) {
      if (!dto.pin) throw credencialesInvalidas();
      const pinOk = await bcrypt.compare(dto.pin, tecnico.pinHash);
      if (!pinOk) throw credencialesInvalidas();
    }

    return this.firmarToken(tecnico.id, RolesEnum.TECNICO, tecnico.nombre, tecnico.sector?.id);
  }

  async loginUsuario(dto: LoginUsuarioDto) {
    const nombre = dto.nombre.trim();
    const usuario = await this.usuarioRepository.findOne({ where: { nombre: ILike(nombre) } });

    const credencialesInvalidas = () => new UnauthorizedException('Nombre o contrasena incorrectos');

    if (!usuario) throw credencialesInvalidas();

    const passwordOk = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordOk) throw credencialesInvalidas();

    return this.firmarToken(usuario.id, usuario.rol, usuario.nombre, usuario.sector?.id ?? null);
  }

  private firmarToken(sub: string, rol: RolesEnum, nombre: string, sectorId?: string | null) {
    const payload = { sub, rol, nombre, sectorId: sectorId ?? null };
    const token = this.jwtService.sign(payload);
    return { token, user: payload };
  }
}
