import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';
import { NGXLogger } from 'ngx-logger';

/**
 * This component displays key error information along with advice to the user to click on a tab to restart. It is routed to by the error handler after an error is thrown.
 * The default information displayed shows 'page not found'.
 * If a mode of 'error' is passed in via a url query parameter the information shown is relevant to an unexpected error.
 */
@Component({
  selector: 'app-text-info',
  templateUrl: './text-info.component.html',
  styleUrls: ['./text-info.component.scss'],
})
export class TextInfoComponent {
  @Input() text = '';
  @Input() isGoBackVisible = false;

  constructor(private location: Location, private logger: NGXLogger) {
    this.logger.trace(`${TextInfoComponent.name}: Starting TextInfoComponent`);
  }

  goBack(): void {
    this.location.back();
  }
}
