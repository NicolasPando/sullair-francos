import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { MovimientosService } from './movimientos.service';
import { DeclararGeneradoDto } from './dto/declarar-generado.dto';
import { SolicitarConsumidoDto } from './dto/solicitar-consumido.dto';
import { RegistrarGuardiaDto } from './dto/registrar-guardia.dto';
import { AjusteDto } from './dto/ajuste.dto';
import { RechazarDto } from './dto/rechazar.dto';
import { EstadoMovimiento } from './movimiento.entity';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import {
  ajusteDecorator,
  declararGeneradoDecorator,
  exportCsvDecorator,
  findAllDecorator,
  misMovimientosDecorator,
  registrarGuardiaDecorator,
  resolverDecorator,
  saldoDecorator,
  saldosDecorator,
  sectorDecorator,
  solicitarConsumidoDecorator,
} from './movimientos.decorators';

@ApiTags('Movimientos')
@Controller('movimientos')
export class MovimientosController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Post('generado')
  @declararGeneradoDecorator()
  declararGenerado(@CurrentUser() user: JwtPayload, @Body() dto: DeclararGeneradoDto) {
    return this.movimientosService.declararGenerado(user, dto);
  }

  @Post('consumido')
  @solicitarConsumidoDecorator()
  solicitarConsumido(@CurrentUser() user: JwtPayload, @Body() dto: SolicitarConsumidoDto) {
    return this.movimientosService.solicitarConsumido(user, dto);
  }

  @Post('guardia')
  @registrarGuardiaDecorator()
  registrarGuardia(@CurrentUser() user: JwtPayload, @Body() dto: RegistrarGuardiaDto) {
    return this.movimientosService.registrarGuardia(user, dto);
  }

  @Post('ajuste')
  @ajusteDecorator()
  ajuste(@CurrentUser() user: JwtPayload, @Body() dto: AjusteDto) {
    return this.movimientosService.ajuste(user, dto);
  }

  @Get('mios')
  @misMovimientosDecorator()
  misMovimientos(@CurrentUser() user: JwtPayload) {
    return this.movimientosService.misMovimientos(user);
  }

  @Get('saldo/:tecnicoId')
  @saldoDecorator()
  saldo(@CurrentUser() user: JwtPayload, @Param('tecnicoId', ParseUUIDPipe) tecnicoId: string) {
    return this.movimientosService.saldo(user, tecnicoId);
  }

  @Get('saldos')
  @saldosDecorator()
  saldos(@CurrentUser() user: JwtPayload, @Query('sectorId') sectorId?: string) {
    return this.movimientosService.saldosPorSector(user, sectorId);
  }

  @Get('sector')
  @sectorDecorator()
  deMiSector(@CurrentUser() user: JwtPayload, @Query('estado') estado?: EstadoMovimiento) {
    return this.movimientosService.movimientosDeMiSector(user, estado);
  }

  @Get('export/csv')
  @exportCsvDecorator()
  async exportCsv(@Res() res: Response) {
    const csv = await this.movimientosService.exportCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="sullair_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  }

  @Get()
  @findAllDecorator()
  findAll(@Query('estado') estado?: EstadoMovimiento) {
    return this.movimientosService.movimientosTodos(estado);
  }

  @Patch(':id/aprobar')
  @resolverDecorator()
  aprobar(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.movimientosService.resolver(user, id, true);
  }

  @Patch(':id/rechazar')
  @resolverDecorator()
  rechazar(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RechazarDto) {
    return this.movimientosService.resolver(user, id, false, dto.motivoRechazo);
  }
}
