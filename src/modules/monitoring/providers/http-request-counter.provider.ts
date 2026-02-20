import { Counter, Registry } from "prom-client";

export const HttpRequestCounterProvider = {
  provide: "HTTP_REQUEST_COUNTER",
  useFactory: (registry: Registry) => {
    return new Counter({
      name: "orcamentos_api_http_requests_total",
      help: "Número total de requisições HTTP",
      labelNames: ["method", "path", "status"],
      registers: [registry],
    });
  },
  inject: [Registry],
};
