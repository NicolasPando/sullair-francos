import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Tecnico } from './tecnico.entity';
import { Sector } from '../entities/sector.entity';
import { TecnicosController } from './tecnicos.controller';
import { TecnicosService } from './tecnicos.service';
import { TecnicosRepository } from './tecnicos.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Tecnico, Sector]), JwtModule],
  controllers: [TecnicosController],
  providers: [TecnicosService, TecnicosRepository],
  exports: [TecnicosRepository],
})
export class TecnicosModule {}
