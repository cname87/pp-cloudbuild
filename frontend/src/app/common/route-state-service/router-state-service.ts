import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NGXLogger } from 'ngx-logger';

/**
 * @title Updates a member id observable.  The value is passed in from the components from the active routed path and cleared when the component is destroSyed.
 */

@Injectable({ providedIn: 'root' })
export class RouteStateService {
  //
  private idState = new BehaviorSubject<string>('');

  id$: Observable<string>;

  constructor(private logger: NGXLogger) {
    this.logger.trace(`${RouteStateService.name}: Starting RouteState service`);
    this.id$ = this.idState.asObservable();
  }

  updateIdState(newId: string) {
    this.logger.trace(`${RouteStateService.name}: Updating route state`);
    this.idState.next(newId);
  }
}
