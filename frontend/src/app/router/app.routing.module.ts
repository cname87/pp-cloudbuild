import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

import { MemberDetailComponent } from '../components/member-detail/member-detail.component';
import { MemberSessionComponent } from '../components/member-session/member-session.component';
import { MemberSessionsComponent } from '../components/member-sessions/member-sessions.component';
import { InformationComponent } from '../components/information/information.component';
import { MembersListComponent } from '../components/members-list/members-list.component';
import { CallbackComponent } from '../components/callback/callback.component';
import { ProfileComponent } from '../components/user-profile/user-profile.component';
import { MemberDetailResolverService } from '../shared/resolvers/member-detail-resolver.service';
import { MemberSessionsResolverService } from '../shared/resolvers/member-sessions-resolver.service';
import { MembersListResolverService } from '../shared/resolvers/members-list-resolver.service';
import { MemberSessionResolverService } from '../shared/resolvers/member-session-resolver.service';
import { SessionsChartComponent } from '../components/sessions-chart/sessions-chart.component';

const appRoutes: Routes = [
  {
    /* default path if no route supplied */
    path: '',
    redirectTo: '/memberslist',
    pathMatch: 'full',
  },
  {
    /* callback from auth0 authentication - it redirects */
    path: 'callback',
    component: CallbackComponent,
  },
  {
    /* shows the list of members */
    path: 'memberslist',
    component: MembersListComponent,
    canActivate: [AuthGuard],
    resolve: {
      members: MembersListResolverService,
    },
  },
  {
    /* shows a member's detail */
    path: 'detail/:id',
    component: MemberDetailComponent,
    canActivate: [AuthGuard],
    resolve: {
      member: MemberDetailResolverService,
    },
  },
  {
    /* session entry for a member */
    path: 'member/:id/session',
    component: MemberSessionComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndSession: MemberSessionResolverService,
    },
  },
  {
    /* session edit for a member */
    path: 'member/:id/session/:sid',
    component: MemberSessionComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndSession: MemberSessionResolverService,
    },
  },
  {
    /* shows a member's sessions */
    path: 'sessions/:id',
    component: MemberSessionsComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndSessions: MemberSessionsResolverService,
    },
  },
  {
    /* charts a member's sessions */
    path: 'charts/:id',
    component: SessionsChartComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndSessions: MemberSessionsResolverService,
    },
  },
  {
    /* shows the authenticated user profile */
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    /* shows not found, error, and login information */
    path: 'information/:mode',
    component: InformationComponent,
  },
  {
    /* otherwise shows the information page, defaulting to page not found */
    path: '**',
    component: InformationComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false }, // true for debugging purposes only
    ),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
