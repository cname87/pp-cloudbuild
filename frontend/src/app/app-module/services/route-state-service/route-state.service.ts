import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NGXLogger } from 'ngx-logger';

/**
 * @title Maintains the state of the url id parameter.
 *
 * The value of the id parameter in the url is passed in from each component.
 * If a url id parameter doesn't exist then null is passed in.
 * This service is used by the nav component to set the id parameter for the active routes (i.e. based on the active user), and also to disable the user routes in routes which have no id parameter, e.g. the member list component.
 */

@Injectable({ providedIn: 'root' })
export class RouteStateService {
  //
  #idState = new BehaviorSubject<string | null>('');

  get id$(): Observable<string | null> {
    return this.#idState.asObservable();
  }

  constructor(private logger: NGXLogger) {
    this.logger.trace(`${RouteStateService.name}: Starting RouteState service`);
  }

  updateIdState(newId: string | null) {
    this.logger.trace(
      `${RouteStateService.name}: Updating route state with id: ${
        newId || 'none'
      }`,
    );
    this.#idState.next(newId);
  }
}
