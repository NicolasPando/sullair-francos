import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TecnicosService } from './tecnicos.service';
import { CreateTecnicoDto } from './dto/create-tecnico.dto';
import { UpdateTecnicoDto } from './dto/update-tecnico.dto';
import {
  createTecnicoDecorator,
  listTecnicosDecorator,
  toggleTecnicoDecorator,
  updateTecnicoDecorator,
} from './tecnicos.decorators';

@ApiTags('Tecnicos')
@Controller('tecnicos')
export class TecnicosController {
  constructor(private readonly tecnicosService: TecnicosService) {}

  @Get()
  @listTecnicosDecorator()
  findAll() {
    return this.tecnicosService.findAll();
  }

  @Post()
  @createTecnicoDecorator()
  create(@Body() dto: CreateTecnicoDto) {
    return this.tecnicosService.create(dto);
  }

  @Put(':id')
  @updateTecnicoDecorator()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTecnicoDto) {
    return this.tecnicosService.update(id, dto);
  }

  @Patch(':id/toggle-activo')
  @toggleTecnicoDecorator()
  toggleActivo(@Param('id', ParseUUIDPipe) id: string) {
    return this.tecnicosService.toggleActivo(id);
  }
}
