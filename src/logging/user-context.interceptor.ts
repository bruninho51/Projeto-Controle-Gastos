import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { setUserId } from "./correlation-id.store";

/**
 * Enriches the current request's log context with the authenticated user's
 * id, so every log line emitted from here on (including the access log and
 * error logs) carries it automatically.
 *
 * This is an interceptor, not the correlation-id middleware, on purpose:
 * `req.user` is populated by Passport's JwtAuthGuard, and guards run AFTER
 * middleware but BEFORE interceptors. Middleware simply can't see it yet.
 * Routes with no guard (or failed auth) leave `req.user` undefined, so this
 * is a no-op for them.
 */
@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const userId = request?.user?.id;

    if (typeof userId === "number") {
      setUserId(userId);
    }

    return next.handle();
  }
}
