import { Component, Input } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-button',
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.scss'],
})
export class ActionButtonComponent {
  //
  @Input() icon = '';
  @Input() isWarn = false;
  @Input() disabled = false;
  @Input() text = '';

  constructor(private logger: NGXLogger) {
    this.logger.trace(
      `${ActionButtonComponent.name}: Starting ActionButtonComponent`,
    );
  }
}
