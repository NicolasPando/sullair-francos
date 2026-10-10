import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Sector } from '../../entities/sector.entity';
import { RolesEnum } from './roles.enum';

// Usuario = encargado de sector o administrador (los tecnicos son su propia entidad, se loguean con PIN)
@Entity({ name: 'usuarios' })
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'enum', enum: RolesEnum })
  rol: RolesEnum.ADMIN | RolesEnum.ENCARGADO;

  // Sectores a cargo del encargado (puede tener varios). Los admins ven todos los sectores.
  @ManyToMany(() => Sector, { eager: true })
  @JoinTable()
  sectores: Sector[];

  // DEPRECADO: columna anterior (un solo sector). Se mantiene para no perder datos al actualizar:
  // al arrancar, UsuariosRepository copia este valor a `sectores`. Se puede borrar mas adelante.
  @ManyToOne(() => Sector, (sector) => sector.usuarios, { eager: true, nullable: true, onDelete: 'SET NULL' })
  sector: Sector | null;

  @Column()
  passwordHash: string;
}
