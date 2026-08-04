import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Movimiento } from './movimiento.entity';
import { Tecnico } from '../tecnicos/tecnico.entity';
import { Sector } from '../entities/sector.entity';
import { MovimientosController } from './movimientos.controller';
import { MovimientosService } from './movimientos.service';
import { MovimientosRepository } from './movimientos.repository';
import { TecnicosRepository } from '../tecnicos/tecnicos.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Movimiento, Tecnico, Sector]), JwtModule],
  controllers: [MovimientosController],
  providers: [MovimientosService, MovimientosRepository, TecnicosRepository],
})
export class MovimientosModule {}
