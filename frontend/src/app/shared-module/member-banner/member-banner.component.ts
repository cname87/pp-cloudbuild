import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { NGXLogger } from 'ngx-logger';
import { Input } from '@angular/core';
import { Observable } from 'rxjs';
import { IMember } from '../../data-providers/models/models';

@Component({
  selector: 'app-member-banner',
  templateUrl: './member-banner.component.html',
  styleUrls: ['./member-banner.component.scss'],
})
export class MemberBannerComponent {
  //
  @Input() member$!: Observable<IMember>;
  @Input() goBackOverride: (() => void) | undefined = undefined;

  constructor(private location: Location, private logger: NGXLogger) {
    this.logger.trace(
      `${MemberBannerComponent.name}: Starting MemberBannerComponent`,
    );
  }

  goBack(): void {
    if (this.goBackOverride) {
      return this.goBackOverride();
    } else {
      this.location.back();
    }
  }
}
