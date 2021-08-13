/* "Barrel" of Http Interceptors */
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { NetworkCacheInterceptor } from './network-cache.interceptor';
import { CachingInterceptor } from './caching.interceptor';
import { AuthInterceptor } from './auth.interceptor';
import { HttpErrorInterceptor } from './http-error.interceptor';
import { E2eTestInterceptor } from './e2e-test.interceptor';
import { ResponseTimeInterceptor } from './response-time.interceptor';

/**
 * Http interceptor providers in order.
 */
export const httpInterceptorProviders = [
  /* request enters here */
  {
    /* logs time on request and response */
    provide: HTTP_INTERCEPTORS,
    useClass: ResponseTimeInterceptor,
    multi: true,
  },
  {
    /* adds no cache on outgoing requests */
    provide: HTTP_INTERCEPTORS,
    useClass: NetworkCacheInterceptor,
    multi: true,
  },
  {
    // eslint-disable-next-line max-len
    /* on receiving the request it checks the cache and returns a cached response if found. If none found then it passes on the request. Passes the response to the cache service */
    provide: HTTP_INTERCEPTORS,
    useClass: CachingInterceptor,
    multi: true,
  },
  {
    /* adds jwt to the request */
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true,
  },
  {
    /* checks for errors in the response */
    provide: HTTP_INTERCEPTORS,
    useClass: HttpErrorInterceptor,
    multi: true,
  },
  {
    /* passes on request if not in e2e test mode */
    provide: HTTP_INTERCEPTORS,
    useClass: E2eTestInterceptor,
    multi: true,
  },
  /* request sent to server here */
];
