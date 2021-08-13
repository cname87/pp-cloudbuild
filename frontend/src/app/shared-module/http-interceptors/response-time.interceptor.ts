import {
  Injectable,
  // Inject,
} from '@angular/core';
import {
  HttpEvent,
  HttpRequest,
  HttpInterceptor,
  HttpHandler,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { NGXLogger, NgxLoggerLevel } from 'ngx-logger';
import { finalize, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ResponseTimeInterceptor implements HttpInterceptor {
  constructor(private logger: NGXLogger) {
    this.logger.trace(
      `${ResponseTimeInterceptor.name}: Starting ResponseTimeInterceptor`,
    );
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    this.logger.trace(`${ResponseTimeInterceptor.name}: intercept called`);

    /* pass through if logger level is set to Off (e.g, production mode) */
    if (environment.logLevel === NgxLoggerLevel.OFF) {
      return next.handle(req);
    }

    const started = Date.now();
    let ok: string;

    // extend server response observable with logging
    return next.handle(req).pipe(
      tap(
        /* succeeds when there is a response */
        (event) =>
          (ok = event instanceof HttpResponse ? 'succeeded' : 'no response'),
        /* operation failed; _error is an HttpErrorResponse */
        (_error) => (ok = 'failed'),
      ),
      /* log when response observable either completes or errors */
      finalize(() => {
        const elapsed = Date.now() - started;
        const msg = `${req.method} "${req.urlWithParams}" ${ok} in ${elapsed} ms.`;
        this.logger.trace(`${ResponseTimeInterceptor.name}: ${msg}`);
      }),
    );
  }
}
