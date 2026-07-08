import { applyDecorators, HttpCode, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RolesDecorator } from '../auth/decorators/roles.decorator';
import { RolesEnum } from '../usuarios/entities/roles.enum';

export function listSectoresDecorator() {
  return applyDecorators(
    ApiOperation({ summary: 'Lista todos los sectores' }),
    ApiBearerAuth(),
    UseGuards(AuthGuard),
  );
}

export function createSectorDecorator() {
  return applyDecorators(
    HttpCode(201),
    ApiOperation({ summary: 'Crea un sector (solo admin)' }),
    ApiResponse({ status: 409, description: 'Ya existe un sector con ese nombre' }),
    ApiBearerAuth(),
    RolesDecorator(RolesEnum.ADMIN),
    UseGuards(AuthGuard, RolesGuard),
  );
}

export function removeSectorDecorator() {
  return applyDecorators(
    ApiOperation({ summary: 'Elimina un sector sin tecnicos activos (solo admin)' }),
    ApiBearerAuth(),
    RolesDecorator(RolesEnum.ADMIN),
    UseGuards(AuthGuard, RolesGuard),
  );
}
