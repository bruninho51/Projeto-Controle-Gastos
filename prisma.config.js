import { defineConfig } from 'prisma/config';
import 'dotenv/config';

const env = (key, fallback) => process.env[key] ?? fallback

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: `mysql://${env('DB_USER', 'user')}:${encodeURIComponent(env('DB_PASSWORD', 'pass'))}@${env('DB_HOST', 'localhost')}:${env('DB_PORT', '3306')}/${env('DB_NAME', 'dummy')}`,
  },
});
