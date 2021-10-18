import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NGXLogger } from 'ngx-logger';

/**
 * @title Updates a member public id observable.  The value is passed in from the components from the active routed path and cleared when the component is destroyed.
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
    this.logger.trace(
      `${RouteStateService.name}: Updating route state with id: ${newId || 0}`,
    );
    this.idState.next(newId);
  }
}
