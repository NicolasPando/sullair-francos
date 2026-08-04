import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tecnico } from '../tecnicos/tecnico.entity';

export enum TipoMovimiento {
  GENERADO = 'generado', // franco ganado por trabajar sabado o domingo
  CONSUMIDO = 'consumido', // franco(s) pedido/tomado
  GUARDIA = 'guardia', // guardia pasiva (no afecta el saldo)
  AJUSTE = 'ajuste', // ajuste manual de saldo (admin o encargado del sector)
}

export enum EstadoMovimiento {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
}

export interface FechaSolicitada {
  fecha: string; // YYYY-MM-DD
  esMedio: boolean; // true si ese dia es el "medio franco"
  turno: 'man' | 'tar' | null; // turno del medio franco, si aplica
}

export interface DiaGuardia {
  fecha: string; // YYYY-MM-DD
  convocado: boolean;
  inicio: string | null; // HH:MM
  fin: string | null; // HH:MM
}

@Entity({ name: 'movimientos' })
export class Movimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tecnico, (tecnico) => tecnico.movimientos, { eager: true })
  tecnico: Tecnico;

  @Column({ type: 'enum', enum: TipoMovimiento })
  tipo: TipoMovimiento;

  // cantidad de francos que suma o resta este movimiento (0 para guardia)
  @Column({ type: 'float' })
  cantidad: number;

  // --- franco generado: siempre sabado (0.5) o domingo (1), calculado en el backend ---
  @Column({ type: 'date', nullable: true })
  fechaTrabajo: string | null;

  @Column({ nullable: true })
  diaTrabajado: 'sabado' | 'domingo' | null;

  // --- franco consumido: puede ser mas de un dia, con un posible "medio franco" ---
  @Column({ type: 'date', nullable: true })
  fechaDeseada: string | null; // primer dia solicitado, para listados rapidos

  @Column({ nullable: true })
  turno: 'man' | 'tar' | null; // turno del medio franco, si lo hay

  @Column({ type: 'jsonb', nullable: true })
  fechasSolicitadas: FechaSolicitada[] | null;

  // --- guardia pasiva: periodo de hasta 7 dias, con detalle dia por dia ---
  @Column({ type: 'date', nullable: true })
  guardiaDesde: string | null;

  @Column({ type: 'date', nullable: true })
  guardiaHasta: string | null;

  @Column({ type: 'jsonb', nullable: true })
  guardiaDias: DiaGuardia[] | null;

  @Column({ type: 'text', nullable: true })
  guardiaNovedades: string | null;

  // --- ajuste ---
  @Column({ type: 'text', nullable: true })
  motivoAjuste: string | null;

  // --- estado / aprobacion ---
  @Column({ type: 'enum', enum: EstadoMovimiento, default: EstadoMovimiento.PENDIENTE })
  estado: EstadoMovimiento;

  @Column({ nullable: true })
  resueltoPor: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resueltoEn: Date | null;

  @Column({ type: 'text', nullable: true })
  motivoRechazo: string | null;

  @Column({ type: 'text', nullable: true })
  comentario: string | null;

  @CreateDateColumn()
  creadoEn: Date;
}
