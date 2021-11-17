import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

/**
 * @title Provides utility functions.
 */

@Injectable({ providedIn: 'root' })
export class UtilsService {
  //

  constructor(private logger: NGXLogger) {
    this.logger.trace(`${UtilsService.name}: Starting Utils service`);
  }

  /**
   * @returns Returns the Sunday that is equal or prior to today. The date is returned as a Date object.
   */
  getLastSunday(): Date {
    let lastSunday = new Date();
    /* get last Sunday */
    lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
    /* remove hours, minutes and seconds */
    lastSunday = new Date(lastSunday.toDateString());
    /* move by the local time offset to move the UTC value to 00:00 on the Sunday */
    lastSunday = new Date(
      lastSunday.getTime() - lastSunday.getTimezoneOffset() * 60 * 1000,
    );
    this.logger.trace(
      `${UtilsService.name}: Last Sunday supplied: ${lastSunday}`,
    );
    return lastSunday;
  }
}
