import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movimiento, EstadoMovimiento, TipoMovimiento } from './movimiento.entity';
import { Tecnico } from '../tecnicos/tecnico.entity';
import { DeclararGeneradoDto } from './dto/declarar-generado.dto';
import { SolicitarConsumidoDto } from './dto/solicitar-consumido.dto';
import { RegistrarGuardiaDto } from './dto/registrar-guardia.dto';
import { AjusteDto } from './dto/ajuste.dto';

// devuelve el dia de la semana (0=domingo..6=sabado) de una fecha YYYY-MM-DD sin desfasajes de timezone
function diaDeLaSemana(fecha: string): number {
  return new Date(`${fecha}T00:00:00`).getDay();
}

function esFinDeSemana(fecha: string): boolean {
  const d = diaDeLaSemana(fecha);
  return d === 0 || d === 6;
}

function listaDeFechas(desde: string, hasta: string): string[] {
  const fechas: string[] = [];
  let cursor = new Date(`${desde}T00:00:00`);
  const fin = new Date(`${hasta}T00:00:00`);
  while (cursor <= fin) {
    fechas.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return fechas;
}

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

  // saldo = generados + ajustes aprobados - consumidos aprobados. Las guardias no afectan el saldo.
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

  // Bulk: saldo de todos los tecnicos de un sector (o de todos, si no se pasa sectorId).
  // Evita N llamadas a saldo() desde el frontend para listados (resumen admin, tecnicos del encargado, etc).
  async saldosPorSector(sectorId?: string) {
    const tecnicos = await this.tecnicoRepository.find({
      where: sectorId ? { sector: { id: sectorId } } : {},
      order: { nombre: 'ASC' },
    });
    const resultados = await Promise.all(
      tecnicos.map(async (t) => ({
        tecnicoId: t.id,
        nombre: t.nombre,
        sector: t.sector?.nombre ?? null,
        activo: t.activo,
        saldo: await this.saldo(t.id),
      })),
    );
    return resultados;
  }

  // Franco generado: solo sabado (0.5) o domingo (1). La cantidad y el dia se calculan
  // en el backend a partir de la fecha, nunca se confia en lo que mande el cliente.
  async declararGenerado(tecnicoId: string, dto: DeclararGeneradoDto) {
    const tecnico = await this.getTecnico(tecnicoId);
    const dia = diaDeLaSemana(dto.fechaTrabajo);
    if (dia !== 0 && dia !== 6) {
      throw new BadRequestException('La fecha trabajada tiene que ser sabado o domingo');
    }
    const diaTrabajado = dia === 6 ? 'sabado' : 'domingo';
    const cantidad = dia === 6 ? 0.5 : 1;

    return this.movimientoRepository.save(
      this.movimientoRepository.create({
        tecnico,
        tipo: TipoMovimiento.GENERADO,
        cantidad,
        fechaTrabajo: dto.fechaTrabajo,
        diaTrabajado,
        comentario: dto.comentario ?? null,
      }),
    );
  }

  // Franco consumido: uno o mas dias (segun la cantidad pedida, redondeada hacia arriba),
  // ninguno puede caer sabado ni domingo. Se puede pedir aunque el saldo quede negativo
  // (el pedido queda pendiente igual, la advertencia es solo informativa en el frontend).
  async solicitarConsumido(tecnicoId: string, dto: SolicitarConsumidoDto) {
    const tecnico = await this.getTecnico(tecnicoId);

    if (Math.round(dto.cantidad * 10) % 5 !== 0) {
      throw new BadRequestException('La cantidad tiene que ser multiplo de 0.5');
    }
    const diasEsperados = Math.ceil(dto.cantidad);
    if (dto.fechas.length !== diasEsperados) {
      throw new BadRequestException(`Para ${dto.cantidad} franco(s) hace falta indicar ${diasEsperados} fecha(s)`);
    }
    for (const f of dto.fechas) {
      if (esFinDeSemana(f.fecha)) {
        throw new BadRequestException('No se pueden tomar francos sabado ni domingo');
      }
    }
    const mediosMarcados = dto.fechas.filter((f) => f.esMedio);
    const tieneMedio = Math.round(dto.cantidad * 10) % 10 === 5;
    if (tieneMedio && mediosMarcados.length !== 1) {
      throw new BadRequestException('Indica cual de los dias es el medio franco');
    }
    if (!tieneMedio && mediosMarcados.length > 0) {
      throw new BadRequestException('Esta cantidad no tiene medio franco');
    }

    const medio = mediosMarcados[0];

    return this.movimientoRepository.save(
      this.movimientoRepository.create({
        tecnico,
        tipo: TipoMovimiento.CONSUMIDO,
        cantidad: dto.cantidad,
        fechaDeseada: dto.fechas[0].fecha,
        turno: medio?.turno ?? null,
        fechasSolicitadas: dto.fechas,
        comentario: dto.comentario ?? null,
      }),
    );
  }

  // Guardia pasiva: periodo de hasta 7 dias con detalle dia por dia. No afecta el saldo de francos.
  async registrarGuardia(tecnicoId: string, dto: RegistrarGuardiaDto) {
    const tecnico = await this.getTecnico(tecnicoId);

    if (dto.guardiaHasta < dto.guardiaDesde) {
      throw new BadRequestException('La fecha de fin no puede ser anterior a la de inicio');
    }
    const diasDelPeriodo = listaDeFechas(dto.guardiaDesde, dto.guardiaHasta);
    if (diasDelPeriodo.length > 7) {
      throw new BadRequestException('El periodo maximo de una guardia es de 7 dias');
    }
    if (dto.guardiaDias.length !== diasDelPeriodo.length) {
      throw new BadRequestException('Falta el detalle de algun dia del periodo');
    }
    for (const d of dto.guardiaDias) {
      if (d.convocado && (!d.inicio || !d.fin)) {
        throw new BadRequestException(`Falta el horario del dia convocado ${d.fecha}`);
      }
    }

    return this.movimientoRepository.save(
      this.movimientoRepository.create({
        tecnico,
        tipo: TipoMovimiento.GUARDIA,
        cantidad: 0,
        guardiaDesde: dto.guardiaDesde,
        guardiaHasta: dto.guardiaHasta,
        guardiaDias: dto.guardiaDias,
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

  // Aprobar/rechazar: a diferencia de la version anterior, aprobar un consumido NO se bloquea
  // si el saldo quedaria negativo (igual que en la app original) - el encargado/admin decide.
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

    movimiento.estado = aprobar ? EstadoMovimiento.APROBADO : EstadoMovimiento.RECHAZADO;
    movimiento.resueltoPor = resueltoPor;
    movimiento.resueltoEn = new Date();
    if (!aprobar) movimiento.motivoRechazo = motivoRechazo ?? null;

    return this.movimientoRepository.save(movimiento);
  }
}
