import { applyDecorators, HttpCode, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RolesDecorator } from '../auth/decorators/roles.decorator';
import { RolesEnum } from '../usuarios/entities/roles.enum';

const conRoles = (...roles: RolesEnum[]) => [RolesDecorator(...roles), UseGuards(AuthGuard, RolesGuard)];

export function declararGeneradoDecorator() {
  return applyDecorators(HttpCode(201), ApiOperation({ summary: 'El tecnico declara un franco generado (sabado o domingo)' }), ApiBearerAuth(), ...conRoles(RolesEnum.TECNICO));
}
export function solicitarConsumidoDecorator() {
  return applyDecorators(HttpCode(201), ApiOperation({ summary: 'El tecnico pide tomarse uno o mas francos' }), ApiBearerAuth(), ...conRoles(RolesEnum.TECNICO));
}
export function registrarGuardiaDecorator() {
  return applyDecorators(HttpCode(201), ApiOperation({ summary: 'El tecnico registra una guardia pasiva (hasta 7 dias, con detalle diario)' }), ApiBearerAuth(), ...conRoles(RolesEnum.TECNICO));
}
export function ajusteDecorator() {
  return applyDecorators(HttpCode(201), ApiOperation({ summary: 'Ajusta manualmente el saldo de un tecnico (admin: cualquiera, encargado: solo su sector)' }), ApiBearerAuth(), ...conRoles(RolesEnum.ADMIN, RolesEnum.ENCARGADO));
}
export function misMovimientosDecorator() {
  return applyDecorators(ApiOperation({ summary: 'Historial del tecnico logueado' }), ApiBearerAuth(), ...conRoles(RolesEnum.TECNICO));
}
export function saldoDecorator() {
  return applyDecorators(ApiOperation({ summary: 'Saldo de francos de un tecnico' }), ApiBearerAuth(), UseGuards(AuthGuard));
}
export function saldosDecorator() {
  return applyDecorators(ApiOperation({ summary: 'Saldo de todos los tecnicos (admin: todos o filtrado por sector, encargado: siempre su sector)' }), ApiBearerAuth(), UseGuards(AuthGuard));
}
export function sectorDecorator() {
  return applyDecorators(ApiOperation({ summary: 'Movimientos del sector del encargado logueado' }), ApiBearerAuth(), ...conRoles(RolesEnum.ENCARGADO));
}
export function findAllDecorator() {
  return applyDecorators(ApiOperation({ summary: 'Todos los movimientos, con filtro opcional por estado (admin)' }), ApiBearerAuth(), ...conRoles(RolesEnum.ADMIN));
}
export function resolverDecorator() {
  return applyDecorators(ApiOperation({ summary: 'Aprueba o rechaza un movimiento pendiente' }), ApiBearerAuth(), ...conRoles(RolesEnum.ENCARGADO, RolesEnum.ADMIN));
}
export function exportCsvDecorator() {
  return applyDecorators(ApiOperation({ summary: 'Exporta todos los movimientos a CSV (admin)' }), ApiBearerAuth(), ...conRoles(RolesEnum.ADMIN));
}
