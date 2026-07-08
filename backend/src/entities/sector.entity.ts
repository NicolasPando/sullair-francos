import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Tecnico } from '../tecnicos/tecnico.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Entity({ name: 'sectores' })
export class Sector {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @OneToMany(() => Tecnico, (tecnico) => tecnico.sector)
  tecnicos: Tecnico[];

  @OneToMany(() => Usuario, (usuario) => usuario.sector)
  usuarios: Usuario[];
}
