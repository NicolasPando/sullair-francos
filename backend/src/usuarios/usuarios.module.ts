import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Usuario } from './entities/usuario.entity';
import { Sector } from '../entities/sector.entity';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { UsuariosRepository } from './usuarios.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Sector]), JwtModule],
  controllers: [UsuariosController],
  providers: [UsuariosService, UsuariosRepository],
})
export class UsuariosModule {}
