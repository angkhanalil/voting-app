import {defineConfig, env} from 'prisma/config';
import path from 'node:path';
import 'dotenv/config';

type Env = {
 DATABASE_URL: string;
};

export default defineConfig({
 //  schema: 'prisma/schema.prisma',
 schema: path.join('prisma', 'schema.prisma'),
 migrations: {
  path: 'prisma/migrations',
 },
 engine: 'classic',
 datasource: {
  url: env<Env>('DATABASE_URL'),
 },
});
