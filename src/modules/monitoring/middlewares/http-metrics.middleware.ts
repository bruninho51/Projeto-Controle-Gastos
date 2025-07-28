import { Injectable, Inject, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(
    @Inject('HTTP_REQUEST_COUNTER')
    private readonly counter: Counter<string>,

    @Inject('HTTP_REQUEST_DURATION_HISTOGRAM')
    private readonly histogram: Histogram<string>,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime();

    res.on('finish', () => {
      // Incrementa contador
      this.counter.inc({
        method: req.method,
        path: req.route?.path || req.originalUrl || 'unknown',
        status: res.statusCode.toString(),
      });

      // Observa latência
      const [seconds, nanoseconds] = process.hrtime(start);
      const durationInSeconds = seconds + nanoseconds / 1e9;

      this.histogram.observe(
        {
          method: req.method,
          path: req.route?.path || req.originalUrl || 'unknown',
          status: res.statusCode.toString(),
        },
        durationInSeconds,
      );
    });

    next();
  }
}
