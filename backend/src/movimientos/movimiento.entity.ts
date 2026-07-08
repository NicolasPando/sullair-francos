import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tecnico } from '../tecnicos/tecnico.entity';

export enum TipoMovimiento {
  GENERADO = 'generado', // franco ganado por trabajar un dia libre
  CONSUMIDO = 'consumido', // franco pedido/tomado
  GUARDIA = 'guardia', // guardia pasiva
  AJUSTE = 'ajuste', // ajuste manual de saldo (admin)
}

export enum EstadoMovimiento {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
}

@Entity({ name: 'movimientos' })
export class Movimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tecnico, (tecnico) => tecnico.movimientos, { eager: true })
  tecnico: Tecnico;

  @Column({ type: 'enum', enum: TipoMovimiento })
  tipo: TipoMovimiento;

  // cantidad de francos que suma o resta este movimiento
  @Column({ type: 'float' })
  cantidad: number;

  // --- franco generado ---
  @Column({ type: 'date', nullable: true })
  fechaTrabajo: string | null;

  @Column({ nullable: true })
  diaTrabajado: string | null;

  // --- franco consumido ---
  @Column({ type: 'date', nullable: true })
  fechaDeseada: string | null;

  @Column({ nullable: true })
  turno: string | null;

  // --- guardia pasiva ---
  @Column({ type: 'date', nullable: true })
  guardiaDesde: string | null;

  @Column({ type: 'date', nullable: true })
  guardiaHasta: string | null;

  @Column({ type: 'jsonb', nullable: true })
  guardiaDias: Record<string, { activo: boolean; desde?: string; hasta?: string }> | null;

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
