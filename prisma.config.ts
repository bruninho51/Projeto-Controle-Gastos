import { defineConfig, env } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: `mysql://${env('DB_USER')}:${encodeURIComponent(env('DB_PASSWORD'))}@${env('DB_HOST')}:${env('DB_PORT')}/${env('DB_NAME')}`,
  },
})