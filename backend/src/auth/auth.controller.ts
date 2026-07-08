import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginTecnicoDto } from './dto/login-tecnico.dto';
import { LoginUsuarioDto } from './dto/login-usuario.dto';
import { SetupDto } from './dto/setup.dto';
import {
  loginTecnicoDecorator,
  loginUsuarioDecorator,
  opcionesDecorator,
  setupDecorator,
} from './auth.decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('opciones')
  @opcionesDecorator()
  opciones() {
    return this.authService.opciones();
  }

  @Post('setup')
  @setupDecorator()
  setup(@Body() setupDto: SetupDto) {
    return this.authService.setup(setupDto);
  }

  @Post('login/tecnico')
  @loginTecnicoDecorator()
  loginTecnico(@Body() dto: LoginTecnicoDto) {
    return this.authService.loginTecnico(dto);
  }

  @Post('login/usuario')
  @loginUsuarioDecorator()
  loginUsuario(@Body() dto: LoginUsuarioDto) {
    return this.authService.loginUsuario(dto);
  }
}
