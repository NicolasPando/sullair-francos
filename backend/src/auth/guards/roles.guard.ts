import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesEnum } from '../../usuarios/entities/roles.enum';

// Mismo patron que roleGuard de AgroManager: compara el rol del JWT
// contra los roles pedidos con @RolesDecorator(...) en el endpoint.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<RolesEnum[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!allowedRoles || allowedRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userRole: RolesEnum = request.user?.rol;

    return allowedRoles.includes(userRole);
  }
}
