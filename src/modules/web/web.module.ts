import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'web'),
      exclude: ['/api*', '/metrics'],
    }),
  ],
  controllers: [],
  providers: [],
})
export class WebModule {}