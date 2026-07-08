import { Injectable } from '@nestjs/common';
import { UsuariosRepository } from './usuarios.repository';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { RolesEnum } from './entities/roles.enum';

@Injectable()
export class UsuariosService {
  constructor(private readonly usuariosRepository: UsuariosRepository) {}

  findAll(rol?: RolesEnum.ADMIN | RolesEnum.ENCARGADO) {
    return this.usuariosRepository.findAll(rol);
  }

  create(dto: CreateUsuarioDto) {
    return this.usuariosRepository.create(dto);
  }

  update(id: string, dto: UpdateUsuarioDto) {
    return this.usuariosRepository.update(id, dto);
  }

  remove(id: string) {
    return this.usuariosRepository.remove(id);
  }
}
