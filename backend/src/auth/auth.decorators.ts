import { applyDecorators, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function opcionesDecorator() {
  return applyDecorators(
    HttpCode(200),
    ApiOperation({ summary: 'Devuelve las listas para armar los selectores de login' }),
    ApiResponse({ status: 200, description: 'Listas de tecnicos, encargados, admins y sectores' }),
  );
}

export function setupDecorator() {
  return applyDecorators(
    HttpCode(201),
    ApiOperation({ summary: 'Configuracion inicial: crea el primer admin y los sectores por defecto' }),
    ApiResponse({ status: 201, description: 'Admin creado, devuelve token' }),
    ApiResponse({ status: 409, description: 'La app ya fue configurada' }),
  );
}

export function loginTecnicoDecorator() {
  return applyDecorators(
    HttpCode(200),
    ApiOperation({ summary: 'Login de tecnico (con o sin PIN)' }),
    ApiResponse({ status: 200, description: 'Login exitoso, devuelve token' }),
    ApiResponse({ status: 401, description: 'PIN incorrecto' }),
  );
}

export function loginUsuarioDecorator() {
  return applyDecorators(
    HttpCode(200),
    ApiOperation({ summary: 'Login de encargado o admin' }),
    ApiResponse({ status: 200, description: 'Login exitoso, devuelve token' }),
    ApiResponse({ status: 401, description: 'Contrasena incorrecta' }),
  );
}
