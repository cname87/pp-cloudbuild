import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';

import { MemberSessionsResolverService } from './resolvers/sessions-resolver.service';
import { SessionsComponent } from './components/sessions.component';

const routes: Routes = [
  {
    path: ``,
    component: SessionsComponent,
    canActivate: [AuthGuard],
    resolve: {
      sessions: MemberSessionsResolverService,
    },
  },
];

@NgModule({
  declarations: [SessionsComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SessionsModule {}
