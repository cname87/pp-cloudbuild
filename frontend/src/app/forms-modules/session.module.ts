import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';
import { FormsBaseModule } from './forms-base.module';
import { MemberSessionResolverService } from '../common/resolvers/member-session-resolver.service';
import { MemberSessionComponent } from './member-session/member-session.component';

const routes: Routes = [
  {
    path: ``,
    component: MemberSessionComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndSession: MemberSessionResolverService,
    },
  },
];

@NgModule({
  declarations: [MemberSessionComponent],
  imports: [FormsBaseModule, RouterModule.forChild(routes), SharedModule],
})
export class SessionModule {}
