import { NgModule } from '@angular/core';
import { RouterModule, Routes, NoPreloading } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';
import { UserTypeGuard } from './guards/user-type.guard';
import { MemberDetailComponent } from '../app-module/components/member-detail/member-detail.component';
import { InformationComponent } from '../app-module/components/information/information.component';
import { MembersListComponent } from '../app-module/components/members-list/members-list.component';
import { CallbackComponent } from '../app-module/components/callback/callback.component';
import { MemberDetailResolverService } from '../app-module/resolvers/member-detail-resolver.service';
import { MembersListResolverService } from '../app-module/resolvers/members-list-resolver.service';
import { routes } from '../configuration/configuration';

const appRoutes: Routes = [
  {
    /* default path if no route supplied */
    path: '',
    canActivate: [UserTypeGuard],
    /* dummy - needed with canActivate as otherwise error thrown */
    children: [],
    pathMatch: 'full',
    data: {
      managerRedirect: routes.membersList.path,
      /* member user.id added to path in the guard */
      memberRedirectRoot: routes.member.path,
    },
  },
  {
    /* callback from auth0 authentication */
    path: routes.callback.path,
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
