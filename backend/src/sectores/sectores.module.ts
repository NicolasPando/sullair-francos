import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sector } from '../entities/sector.entity';
import { Tecnico } from '../tecnicos/tecnico.entity';
import { SectoresController } from './sectores.controller';
import { SectoresService } from './sectores.service';
import { SectoresRepository } from './sectores.repository';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Sector, Tecnico]), JwtModule],
  controllers: [SectoresController],
  providers: [SectoresService, SectoresRepository],
})
export class SectoresModule {}
