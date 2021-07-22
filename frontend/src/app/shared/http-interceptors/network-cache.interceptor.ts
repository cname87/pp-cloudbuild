import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
} from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';

/**
 * @summary
 * Adds no cache headers to all outgoing requests.
 */

@Injectable()
export class NetworkCacheInterceptor implements HttpInterceptor {
  constructor(private logger: NGXLogger) {
    this.logger.trace(`${NetworkCacheInterceptor.name}: intercept started`);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    this.logger.trace(`${NetworkCacheInterceptor.name}: intercept called`);

    const httpRequest = req.clone({
      headers: req.headers
        .set('Cache-Control', 'no-cache, no-store, must-revalidate')
        .set('Pragma', 'no-cache')
        .set('Expires', 'Sat, 01 Jan 2000 00:00:00 GMT')
        .set('If-Modified-Since', '0'),
    });
    return next.handle(httpRequest);
  }
}
