import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { Registry } from 'prom-client';
import { HttpMetricsMiddleware } from './middlewares/http-metrics.middleware';
import { HttpRequestCounterProvider } from './providers/http-request-counter.provider';
import { HttpRequestDurationProvider } from './providers/http_request_duration.provider';

@Module({
  providers: [
    {
      provide: Registry,
      useValue: new Registry(),
    },
    HttpRequestCounterProvider,
    HttpRequestDurationProvider,
  ],
  exports: [Registry],
})
export class MonitoringModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpMetricsMiddleware).forRoutes('*');
  }
}