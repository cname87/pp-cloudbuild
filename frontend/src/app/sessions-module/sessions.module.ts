import { NgModule } from '@angular/core';
import { SharedModule } from '../shared-module/shared.module';

import { SessionsParentComponent } from './components/sessions-parent.component';
import { SessionsComponent } from './components/sessions/sessions.component';
import { SessionComponent } from './components/session/session.component';
import { SessionsRoutingModule } from './sessions.routing.module';
import { SessionsStore } from './store/sessions.store';

@NgModule({
  declarations: [SessionsParentComponent, SessionComponent, SessionsComponent],
  imports: [SharedModule, SessionsRoutingModule],
  providers: [SessionsStore],
})
export class SessionsModule {}
