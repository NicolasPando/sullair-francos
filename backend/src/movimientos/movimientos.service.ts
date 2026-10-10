import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { MovimientosRepository } from './movimientos.repository';
import { TecnicosRepository } from '../tecnicos/tecnicos.repository';
import { DeclararGeneradoDto } from './dto/declarar-generado.dto';
import { SolicitarConsumidoDto } from './dto/solicitar-consumido.dto';
import { RegistrarGuardiaDto } from './dto/registrar-guardia.dto';
import { AjusteDto } from './dto/ajuste.dto';
import { EstadoMovimiento } from './movimiento.entity';
import { JwtPayload } from '../auth/decorators/current-user.decorator';
import { RolesEnum } from '../usuarios/entities/roles.enum';

@Injectable()
export class MovimientosService {
  constructor(
    private readonly movimientosRepository: MovimientosRepository,
    private readonly tecnicosRepository: TecnicosRepository,
    @InjectRepository(Usuario) private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  // Sectores que un usuario puede gestionar. Admin: undefined (sin restriccion). Encargado: los sectores
  // que tiene asignados HOY en la base (no los del token), asi un cambio de asignacion aplica enseguida.
  private async sectoresPermitidos(user: JwtPayload): Promise<string[] | undefined> {
    if (user.rol !== RolesEnum.ENCARGADO) return undefined;
    const usuario = await this.usuarioRepository.findOne({ where: { id: user.sub } });
    return (usuario?.sectores ?? []).map((s) => s.id);
  }

  declararGenerado(user: JwtPayload, dto: DeclararGeneradoDto) {
    return this.movimientosRepository.declararGenerado(user.sub, dto);
  }

  solicitarConsumido(user: JwtPayload, dto: SolicitarConsumidoDto) {
    return this.movimientosRepository.solicitarConsumido(user.sub, dto);
  }

  registrarGuardia(user: JwtPayload, dto: RegistrarGuardiaDto) {
    return this.movimientosRepository.registrarGuardia(user.sub, dto);
  }

  // Admin puede ajustar a cualquier tecnico. Encargado solo a tecnicos de su propio sector.
  async ajuste(user: JwtPayload, dto: AjusteDto) {
    const permitidos = await this.sectoresPermitidos(user);
    if (permitidos) {
      const tecnico = await this.tecnicosRepository.findOne(dto.tecnicoId);
      if (!permitidos.includes(tecnico.sector?.id)) {
        throw new ForbiddenException('Solo podes ajustar el saldo de tecnicos de tus sectores');
      }
    }
    return this.movimientosRepository.ajuste(dto, user.nombre);
  }

  misMovimientos(user: JwtPayload) {
    return this.movimientosRepository.findByTecnico(user.sub);
  }

  async saldo(user: JwtPayload, tecnicoId: string) {
    // un tecnico solo puede ver su propio saldo; encargado/admin pueden ver cualquiera
    if (user.rol === RolesEnum.TECNICO && user.sub !== tecnicoId) {
      throw new ForbiddenException('No podes ver el saldo de otro tecnico');
    }
    return { tecnicoId, saldo: await this.movimientosRepository.saldo(tecnicoId) };
  }

  // Listado con saldo calculado para cada tecnico. Un encargado siempre queda
  // restringido a sus sectores asignados, sin importar que sectorId le pidan.
  async saldosPorSector(user: JwtPayload, sectorId?: string) {
    const permitidos = await this.sectoresPermitidos(user);
    let sectores: string[] | undefined;
    if (permitidos) sectores = sectorId ? permitidos.filter((id) => id === sectorId) : permitidos;
    else sectores = sectorId ? [sectorId] : undefined;
    return this.movimientosRepository.saldosPorSector(sectores);
  }

  async movimientosDeMiSector(user: JwtPayload, estado?: EstadoMovimiento) {
    return this.movimientosRepository.findBySector((await this.sectoresPermitidos(user)) ?? [], estado);
  }

  movimientosTodos(estado?: EstadoMovimiento) {
    return this.movimientosRepository.findAll(estado);
  }

  async resolver(user: JwtPayload, id: string, aprobar: boolean, motivoRechazo?: string) {
    const permitidos = await this.sectoresPermitidos(user);
    return this.movimientosRepository.resolver(id, aprobar, user.nombre, motivoRechazo, permitidos);
  }

  async toggleCronos(user: JwtPayload, id: string) {
    return this.movimientosRepository.toggleCronos(id, await this.sectoresPermitidos(user));
  }

  async exportCsv() {
    const movimientos = await this.movimientosRepository.findAll();
    const headers = [
      'id', 'tecnico', 'sector', 'tipo', 'cantidad', 'fecha_trabajo', 'dia_trabajado',
      'fecha_deseada', 'turno', 'fechas_solicitadas', 'guardia_desde', 'guardia_hasta',
      'guardia_dias', 'guardia_novedades',
      'estado', 'cronos', 'creado_en', 'resuelto_por', 'resuelto_en', 'motivo_rechazo', 'motivo_ajuste', 'comentario',
    ];

    const q = (v: unknown) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const rows = movimientos.map((m) =>
      [
        m.id, m.tecnico?.nombre, m.tecnico?.sector?.nombre, m.tipo, m.cantidad, m.fechaTrabajo,
        m.diaTrabajado, m.fechaDeseada, m.turno, m.fechasSolicitadas ? JSON.stringify(m.fechasSolicitadas) : '',
        m.guardiaDesde, m.guardiaHasta, m.guardiaDias ? JSON.stringify(m.guardiaDias) : '', m.guardiaNovedades,
        m.estado, m.tipo === 'consumido' || m.tipo === 'guardia' ? (m.cronos ? 'si' : 'no') : '', m.creadoEn?.toISOString(), m.resueltoPor, m.resueltoEn?.toISOString(),
        m.motivoRechazo, m.motivoAjuste, m.comentario,
      ]
        .map(q)
        .join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
