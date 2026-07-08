import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Mismo patron que el AuthGuard de AgroManager: valida el Bearer token
// y cuelga el payload decodificado en request.user.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Falta el header de autorizacion');
    }

    const [authType, token] = authHeader.split(' ');
    if (authType !== 'Bearer') {
      throw new UnauthorizedException('Tipo de autorizacion invalido');
    }

    try {
      const secret = process.env.JWT_SECRET;
      const payload = await this.jwtService.verify(token, { secret });
      request.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token invalido o expirado');
    }
  }
}
