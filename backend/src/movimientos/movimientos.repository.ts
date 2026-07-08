import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movimiento, EstadoMovimiento, TipoMovimiento } from './movimiento.entity';
import { Tecnico } from '../tecnicos/tecnico.entity';
import { DeclararGeneradoDto } from './dto/declarar-generado.dto';
import { SolicitarConsumidoDto } from './dto/solicitar-consumido.dto';
import { RegistrarGuardiaDto } from './dto/registrar-guardia.dto';
import { AjusteDto } from './dto/ajuste.dto';

@Injectable()
export class MovimientosRepository {
  constructor(
    @InjectRepository(Movimiento) private readonly movimientoRepository: Repository<Movimiento>,
    @InjectRepository(Tecnico) private readonly tecnicoRepository: Repository<Tecnico>,
  ) {}

  private async getTecnico(id: string) {
    const tecnico = await this.tecnicoRepository.findOne({ where: { id } });
    if (!tecnico) throw new NotFoundException('Tecnico no encontrado');
    return tecnico;
  }

  // saldo = suma de generados y ajustes aprobados - consumidos aprobados
  // las guardias no suman/restan solas: generan francos como "generado" via cantidad ya cargada
  async saldo(tecnicoId: string): Promise<number> {
    const movimientos = await this.movimientoRepository.find({
      where: { tecnico: { id: tecnicoId }, estado: EstadoMovimiento.APROBADO },
    });
    return movimientos.reduce((acc, m) => {
      if (m.tipo === TipoMovimiento.GENERADO || m.tipo === TipoMovimiento.AJUSTE) return acc + m.cantidad;
      if (m.tipo === TipoMovimiento.CONSUMIDO) return acc - m.cantidad;
      return acc;
    }, 0);
  }

  async declararGenerado(tecnicoId: string, dto: DeclararGeneradoDto) {
    const tecnico = await this.getTecnico(tecnicoId);
    return this.movimientoRepository.save(
      this.movimientoRepository.create({
        tecnico,
        tipo: TipoMovimiento.GENERADO,
        cantidad: 1,
        fechaTrabajo: dto.fechaTrabajo,
        diaTrabajado: dto.diaTrabajado ?? null,
        comentario: dto.comentario ?? null,
      }),
    );
  }

  async solicitarConsumido(tecnicoId: string, dto: SolicitarConsumidoDto) {
    const tecnico = await this.getTecnico(tecnicoId);
    const saldoActual = await this.saldo(tecnicoId);
    if (saldoActual < 1) {
      throw new BadRequestException('No tenes saldo de francos disponible');
    }
    return this.movimientoRepository.save(
      this.movimientoRepository.create({
        tecnico,
        tipo: TipoMovimiento.CONSUMIDO,
        cantidad: 1,
        fechaDeseada: dto.fechaDeseada,
        turno: dto.turno ?? null,
        comentario: dto.comentario ?? null,
      }),
    );
  }

  async registrarGuardia(tecnicoId: string, dto: RegistrarGuardiaDto) {
    const tecnico = await this.getTecnico(tecnicoId);
    return this.movimientoRepository.save(
      this.movimientoRepository.create({
        tecnico,
        tipo: TipoMovimiento.GUARDIA,
        cantidad: dto.cantidad,
        guardiaDesde: dto.guardiaDesde,
        guardiaHasta: dto.guardiaHasta,
        guardiaDias: dto.guardiaDias ?? null,
        guardiaNovedades: dto.guardiaNovedades ?? null,
      }),
    );
  }

  async ajuste(dto: AjusteDto, resueltoPor: string) {
    const tecnico = await this.getTecnico(dto.tecnicoId);
    return this.movimientoRepository.save(
      this.movimientoRepository.create({
        tecnico,
        tipo: TipoMovimiento.AJUSTE,
        cantidad: dto.cantidad,
        motivoAjuste: dto.motivoAjuste,
        estado: EstadoMovimiento.APROBADO,
        resueltoPor,
        resueltoEn: new Date(),
      }),
    );
  }

  findByTecnico(tecnicoId: string) {
    return this.movimientoRepository.find({
      where: { tecnico: { id: tecnicoId } },
      order: { creadoEn: 'DESC' },
    });
  }

  findBySector(sectorId: string, estado?: EstadoMovimiento) {
    return this.movimientoRepository.find({
      where: { tecnico: { sector: { id: sectorId } }, ...(estado ? { estado } : {}) },
      order: { creadoEn: 'DESC' },
    });
  }

  findAll(estado?: EstadoMovimiento) {
    return this.movimientoRepository.find({
      where: estado ? { estado } : {},
      order: { creadoEn: 'DESC' },
    });
  }

  async resolver(
    id: string,
    aprobar: boolean,
    resueltoPor: string,
    motivoRechazo?: string,
    restringirASectorId?: string,
  ) {
    const movimiento = await this.movimientoRepository.findOne({ where: { id } });
    if (!movimiento) throw new NotFoundException('Movimiento no encontrado');
    if (restringirASectorId && movimiento.tecnico.sector?.id !== restringirASectorId) {
      throw new NotFoundException('Movimiento no encontrado');
    }
    if (movimiento.estado !== EstadoMovimiento.PENDIENTE) {
      throw new BadRequestException('Este movimiento ya fue resuelto');
    }

    if (aprobar && movimiento.tipo === TipoMovimiento.CONSUMIDO) {
      const saldoActual = await this.saldo(movimiento.tecnico.id);
      if (saldoActual < movimiento.cantidad) {
        throw new BadRequestException('El tecnico ya no tiene saldo suficiente para aprobar este franco');
      }
    }

    movimiento.estado = aprobar ? EstadoMovimiento.APROBADO : EstadoMovimiento.RECHAZADO;
    movimiento.resueltoPor = resueltoPor;
    movimiento.resueltoEn = new Date();
    if (!aprobar) movimiento.motivoRechazo = motivoRechazo ?? null;

    return this.movimientoRepository.save(movimiento);
  }
}
