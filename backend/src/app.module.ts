import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import typeOrmConfig from './configs/typeOrm.config';
import { AuthModule } from './auth/auth.module';
import { SectoresModule } from './sectores/sectores.module';
import { TecnicosModule } from './tecnicos/tecnicos.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { MovimientosModule } from './movimientos/movimientos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [typeOrmConfig] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('typeorm'),
    }),
    JwtModule.register({
      global: true,
      signOptions: { expiresIn: '12h' },
      secret: process.env.JWT_SECRET,
    }),
    AuthModule,
    SectoresModule,
    TecnicosModule,
    UsuariosModule,
    MovimientosModule,
  ],
})
export class AppModule {}
