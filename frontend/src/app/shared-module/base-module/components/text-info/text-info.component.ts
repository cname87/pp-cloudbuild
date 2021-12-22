import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

/**
 * This component displays simple text information on a page.  It includes a button that can be shown, which emits an event when clicked.
 */
@Component({
  selector: 'app-text-info',
  templateUrl: './text-info.component.html',
  styleUrls: ['./text-info.component.scss'],
})
export class TextInfoComponent {
  @Input() line1 = '';
  @Input() line2 = '';
  @Input() line3 = '';
  @Input() line4 = '';
  @Input() isGoBackVisible = true;
  @Output() backClicked = new EventEmitter<string>();

  constructor(private logger: NGXLogger) {
    this.logger.trace(`${TextInfoComponent.name}: Starting TextInfoComponent`);
  }

  clickBack(flag = 'default'): void {
    this.backClicked.emit(flag);
  }
}
