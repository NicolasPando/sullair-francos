import { applyDecorators, HttpCode, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RolesDecorator } from '../auth/decorators/roles.decorator';
import { RolesEnum } from './entities/roles.enum';

const soloAdmin = () => [RolesDecorator(RolesEnum.ADMIN), UseGuards(AuthGuard, RolesGuard)];

export function listUsuariosDecorator() {
  return applyDecorators(ApiOperation({ summary: 'Lista encargados y admins (solo admin)' }), ApiBearerAuth(), ...soloAdmin());
}

export function createUsuarioDecorator() {
  return applyDecorators(HttpCode(201), ApiOperation({ summary: 'Crea un encargado o admin (solo admin)' }), ApiBearerAuth(), ...soloAdmin());
}

export function updateUsuarioDecorator() {
  return applyDecorators(ApiOperation({ summary: 'Edita un encargado o admin (solo admin)' }), ApiBearerAuth(), ...soloAdmin());
}

export function removeUsuarioDecorator() {
  return applyDecorators(ApiOperation({ summary: 'Elimina un encargado o admin (solo admin)' }), ApiBearerAuth(), ...soloAdmin());
}
