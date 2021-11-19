import { Injectable } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { PreloadingStrategy, Route } from '@angular/router';
import { NGXLogger } from 'ngx-logger';

@Injectable()
export class CustomPreloadStrategy implements PreloadingStrategy {
  //
  constructor(private logger: NGXLogger) {
    this.logger.trace(
      `${CustomPreloadStrategy.name}: Starting CustomPreloadStrategy`,
    );
  }

  preload(route: Route, loadMe: () => Observable<any>): Observable<any> {
    if (route.data && route.data['preload']) {
      const delay: number = route.data['delay'];
      this.logger.trace(
        `${CustomPreloadStrategy.name}: Preload called on ${route.path}, delay is ${delay}`,
      );
      return timer(delay).pipe(
        flatMap((_) => {
          this.logger.trace(
            `${CustomPreloadStrategy.name}: Loading now ${route.path}`,
          );
          return loadMe();
        }),
      );
    } else {
      this.logger.trace(
        `${CustomPreloadStrategy.name}: No preload for ${route.path}`,
      );
      return of(null);
    }
  }
}
