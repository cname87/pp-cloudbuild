import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';
import { FormsBaseModule } from './forms-base.module';
import { MemberSessionsResolverService } from '../common/resolvers/member-sessions-resolver.service';
import { MemberSessionsComponent } from './member-sessions/member-sessions.component';

const routes: Routes = [
  {
    path: ``,
    component: MemberSessionsComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndSessions: MemberSessionsResolverService,
    },
  },
];

@NgModule({
  declarations: [MemberSessionsComponent],
  imports: [FormsBaseModule, RouterModule.forChild(routes), SharedModule],
})
export class SessionsModule {}
