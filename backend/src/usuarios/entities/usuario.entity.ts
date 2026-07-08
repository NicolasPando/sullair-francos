import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Sector } from '../../entities/sector.entity';
import { RolesEnum } from './roles.enum';

// Usuario = encargado de sector o administrador (los tecnicos son su propia entidad, se loguean con PIN)
@Entity({ name: 'usuarios' })
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'enum', enum: RolesEnum })
  rol: RolesEnum.ADMIN | RolesEnum.ENCARGADO;

  // solo aplica a encargados. Los admins ven todos los sectores.
  @ManyToOne(() => Sector, (sector) => sector.usuarios, { eager: true, nullable: true })
  sector: Sector | null;

  @Column()
  passwordHash: string;
}
