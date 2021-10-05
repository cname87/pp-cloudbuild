import { NgModule } from '@angular/core';
import { RouterModule, Routes, NoPreloading } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';
import { MemberDetailComponent } from '../app-module/components/member-detail/member-detail.component';
import { InformationComponent } from '../app-module/components/information/information.component';
import { MembersListComponent } from '../app-module/components/members-list/members-list.component';
import { CallbackComponent } from '../app-module/components/callback/callback.component';
import { ProfileComponent } from '../app-module/components/user-profile/user-profile.component';
import { MemberDetailResolverService } from '../common/resolvers/member-detail-resolver.service';
import { MembersListResolverService } from '../common/resolvers/members-list-resolver.service';
import { routes } from '../common/configuration';

const appRoutes: Routes = [
  {
    /* default path if no route supplied */
    path: '',
    redirectTo: routes.loginTarget.path,
    pathMatch: 'full',
  },
  {
    /* callback from auth0 authentication - it redirects */
    path: 'callback',
    component: CallbackComponent,
  },
  {
    /* shows the list of members */
    path: routes.membersList.path,
    component: MembersListComponent,
    canActivate: [AuthGuard],
    resolve: {
      members: MembersListResolverService,
    },
  },
  {
    /* shows a member's detail */
    path: `${routes.member.path}/:id`,
    component: MemberDetailComponent,
    canActivate: [AuthGuard],
    resolve: {
      member: MemberDetailResolverService,
    },
  },
  // {
  //   /* charts a member's sessions */
  //   path: `${routes.charts.path}/:id`,
  //   loadChildren: () =>
  //     import('../charts-module/charts.module.ts.bak').then((m) => m.ChartsModule),
  // },
  {
    /* shows a member's weekly questionaire scores */
    path: `${routes.scores.path}/:id`,
    loadChildren: () =>
      import('../scores-module/scores.module').then((m) => m.ScoresModule),
  },
  {
    /* shows a member's weekly session data */
    path: `${routes.sessions.path}/:id`,
    loadChildren: () =>
      import('../sessions-module/sessions.module').then(
        (m) => m.SessionsModule,
      ),
  },
  {
    /* shows a member's summary data */
    path: `${routes.summary.path}/:id`,
    loadChildren: () =>
      import('../summary-module/summary.module').then((m) => m.SummaryModule),
  },
  {
    /* shows the authenticated user profile */
    path: routes.profile.path,
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
    RouterModule.forRoot(appRoutes, {
      enableTracing: false, // true for debugging purposes only
      preloadingStrategy: NoPreloading, // reLoading seems to slow initial page load
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
