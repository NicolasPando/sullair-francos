// Script opcional para cargar datos de prueba.
// Uso: npm run seed  (con la app y la base ya levantadas / .env configurado)
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { TecnicosRepository } from './tecnicos/tecnicos.repository';
import { UsuariosRepository } from './usuarios/usuarios.repository';
import { RolesEnum } from './usuarios/entities/roles.enum';
import { SectoresRepository } from './sectores/sectores.repository';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const authService = app.get(AuthService);
  const sectoresRepository = app.get(SectoresRepository);
  const tecnicosRepository = app.get(TecnicosRepository);
  const usuariosRepository = app.get(UsuariosRepository);

  if (await authService.setupPendiente()) {
    await authService.setup({ nombre: 'Mauro Palazzo', password: 'admin1234' });
    console.log('Admin inicial: Mauro Palazzo / admin1234');
  }

  const sectores = await sectoresRepository.findAll();
  const altura = sectores.find((s) => s.nombre === 'Altura') ?? (await sectoresRepository.create({ nombre: 'Altura' }));

  await tecnicosRepository.create({ nombre: 'Juan Perez', sectorId: altura.id, pin: '1234' });
  await tecnicosRepository.create({ nombre: 'Carla Diaz', sectorId: altura.id });

  await usuariosRepository.create({
    nombre: 'Laura Sosa',
    rol: RolesEnum.ENCARGADO,
    sectorId: altura.id,
    password: 'encargada1234',
  });

  console.log('Seed completo.');
  await app.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
