import { SetMetadata } from '@nestjs/common';
import { RolesEnum } from '../../usuarios/entities/roles.enum';

export const RolesDecorator = (...roles: RolesEnum[]) => SetMetadata('roles', roles);
