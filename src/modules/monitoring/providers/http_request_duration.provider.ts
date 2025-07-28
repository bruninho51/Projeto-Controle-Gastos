import { Histogram, Registry } from 'prom-client';

export const HttpRequestDurationProvider = {
  provide: 'HTTP_REQUEST_DURATION_HISTOGRAM',
  useFactory: (registry: Registry) => {
    return new Histogram({
      name: 'orcamentos_api_http_request_duration_seconds',
      help: 'Duração das requisições HTTP em segundos',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 1, 3, 5, 10], // em segundos
      registers: [registry],
    });
  },
  inject: [Registry],
};