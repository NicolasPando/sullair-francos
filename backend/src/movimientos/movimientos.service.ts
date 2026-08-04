import { ForbiddenException, Injectable } from '@nestjs/common';
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
  ) {}

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
    if (user.rol === RolesEnum.ENCARGADO) {
      const tecnico = await this.tecnicosRepository.findOne(dto.tecnicoId);
      if (tecnico.sector?.id !== user.sectorId) {
        throw new ForbiddenException('Solo podes ajustar el saldo de tecnicos de tu sector');
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
  // restringido a su propio sector, sin importar que sectorId le pidan.
  saldosPorSector(user: JwtPayload, sectorId?: string) {
    const sectorEfectivo = user.rol === RolesEnum.ENCARGADO ? user.sectorId : sectorId;
    return this.movimientosRepository.saldosPorSector(sectorEfectivo);
  }

  movimientosDeMiSector(user: JwtPayload, estado?: EstadoMovimiento) {
    return this.movimientosRepository.findBySector(user.sectorId, estado);
  }

  movimientosTodos(estado?: EstadoMovimiento) {
    return this.movimientosRepository.findAll(estado);
  }

  async resolver(user: JwtPayload, id: string, aprobar: boolean, motivoRechazo?: string) {
    const restringirASectorId = user.rol === RolesEnum.ENCARGADO ? user.sectorId : undefined;
    return this.movimientosRepository.resolver(id, aprobar, user.nombre, motivoRechazo, restringirASectorId);
  }

  async exportCsv() {
    const movimientos = await this.movimientosRepository.findAll();
    const headers = [
      'id', 'tecnico', 'sector', 'tipo', 'cantidad', 'fecha_trabajo', 'dia_trabajado',
      'fecha_deseada', 'turno', 'fechas_solicitadas', 'guardia_desde', 'guardia_hasta',
      'guardia_dias', 'guardia_novedades',
      'estado', 'creado_en', 'resuelto_por', 'resuelto_en', 'motivo_rechazo', 'motivo_ajuste', 'comentario',
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
        m.estado, m.creadoEn?.toISOString(), m.resueltoPor, m.resueltoEn?.toISOString(),
        m.motivoRechazo, m.motivoAjuste, m.comentario,
      ]
        .map(q)
        .join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
