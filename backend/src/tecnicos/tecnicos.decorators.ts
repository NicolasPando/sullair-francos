import { applyDecorators, HttpCode, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RolesDecorator } from '../auth/decorators/roles.decorator';
import { RolesEnum } from '../usuarios/entities/roles.enum';

const soloAdmin = () => [RolesDecorator(RolesEnum.ADMIN), UseGuards(AuthGuard, RolesGuard)];

export function listTecnicosDecorator() {
  return applyDecorators(
    ApiOperation({ summary: 'Lista todos los tecnicos' }),
    ApiBearerAuth(),
    UseGuards(AuthGuard),
  );
}

export function createTecnicoDecorator() {
  return applyDecorators(HttpCode(201), ApiOperation({ summary: 'Crea un tecnico (solo admin)' }), ApiBearerAuth(), ...soloAdmin());
}

export function updateTecnicoDecorator() {
  return applyDecorators(ApiOperation({ summary: 'Edita un tecnico (solo admin)' }), ApiBearerAuth(), ...soloAdmin());
}

export function toggleTecnicoDecorator() {
  return applyDecorators(ApiOperation({ summary: 'Activa o desactiva un tecnico (solo admin)' }), ApiBearerAuth(), ...soloAdmin());
}
