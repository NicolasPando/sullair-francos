import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenvConfig({ path: '.env' });

const config = {
  type: 'postgres',
  database: process.env.DB_database,
  host: process.env.DB_host,
  port: parseInt(process.env.DB_port, 10),
  username: process.env.DB_username,
  password: process.env.DB_password,
  // en Render/Railway la conexion a Postgres suele requerir SSL
  ssl: process.env.DB_ssl === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: true, // ok para este proyecto chico; en un caso real se usarian migrations
  logging: false,
  autoLoadEntities: true,
};

export default registerAs('typeorm', () => config);

export const connectionSource = new DataSource(config as DataSourceOptions);
