import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Sector } from '../entities/sector.entity';
import { Movimiento } from '../movimientos/movimiento.entity';

@Entity({ name: 'tecnicos' })
export class Tecnico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @ManyToOne(() => Sector, (sector) => sector.tecnicos, { eager: true })
  sector: Sector;

  @Column({ default: true })
  activo: boolean;

  // hash del PIN de 4 digitos. Si es null, el tecnico entra sin PIN.
  @Column({ nullable: true })
  pinHash: string | null;

  @OneToMany(() => Movimiento, (movimiento) => movimiento.tecnico)
  movimientos: Movimiento[];
}
