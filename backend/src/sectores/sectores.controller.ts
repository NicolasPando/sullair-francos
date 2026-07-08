import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SectoresService } from './sectores.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import {
  createSectorDecorator,
  listSectoresDecorator,
  removeSectorDecorator,
} from './sectores.decorators';

@ApiTags('Sectores')
@Controller('sectores')
export class SectoresController {
  constructor(private readonly sectoresService: SectoresService) {}

  @Get()
  @listSectoresDecorator()
  findAll() {
    return this.sectoresService.findAll();
  }

  @Post()
  @createSectorDecorator()
  create(@Body() dto: CreateSectorDto) {
    return this.sectoresService.create(dto);
  }

  @Delete(':id')
  @removeSectorDecorator()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.sectoresService.remove(id);
  }
}
