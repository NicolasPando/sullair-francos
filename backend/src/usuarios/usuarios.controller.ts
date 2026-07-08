import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { RolesEnum } from './entities/roles.enum';
import {
  createUsuarioDecorator,
  listUsuariosDecorator,
  removeUsuarioDecorator,
  updateUsuarioDecorator,
} from './usuarios.decorators';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @listUsuariosDecorator()
  findAll(@Query('rol') rol?: RolesEnum.ADMIN | RolesEnum.ENCARGADO) {
    return this.usuariosService.findAll(rol);
  }

  @Post()
  @createUsuarioDecorator()
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @Put(':id')
  @updateUsuarioDecorator()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, dto);
  }

  @Delete(':id')
  @removeUsuarioDecorator()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.remove(id);
  }
}
