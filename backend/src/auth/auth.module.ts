import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Tecnico } from '../tecnicos/tecnico.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Sector } from '../entities/sector.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tecnico, Usuario, Sector])],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
