import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';

import { MemberSessionsResolverService } from './resolvers/sessions-resolver.service';
import { MemberSessionsComponent } from './components/member-sessions.component';

const routes: Routes = [
  {
    path: ``,
    component: MemberSessionsComponent,
    canActivate: [AuthGuard],
    resolve: {
      sessions: MemberSessionsResolverService,
    },
  },
];

@NgModule({
  declarations: [MemberSessionsComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SessionsModule {}
