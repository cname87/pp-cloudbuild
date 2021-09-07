import { NgModule } from '@angular/core';
import { RouterModule, Routes, NoPreloading } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';

import { MemberDetailComponent } from '../components/member-detail/member-detail.component';
import { InformationComponent } from '../components/information/information.component';
import { MembersListComponent } from '../components/members-list/members-list.component';
import { CallbackComponent } from '../components/callback/callback.component';
import { ProfileComponent } from '../components/user-profile/user-profile.component';
import { MemberDetailResolverService } from '../common/resolvers/member-detail-resolver.service';
import { MembersListResolverService } from '../common/resolvers/members-list-resolver.service';
import { routes } from '../common/config';

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
  {
    /* session entry for a member */
    path: `${routes.session.path1}/:id/${routes.session.path2}`,
    loadChildren: () =>
      import('../forms-modules/session.module').then((m) => m.SessionModule),
  },
  {
    /* session edit for a member */
    path: `${routes.session.path1}/:id/${routes.session.path2}/:sid`,
    loadChildren: () =>
      import('../forms-modules/session.module').then((m) => m.SessionModule),
  },
  {
    /* shows a member's sessions */
    path: `${routes.sessions.path}/:id`,
    loadChildren: () =>
      import('../forms-modules/sessions.module').then((m) => m.SessionsModule),
  },
  {
    /* charts a member's sessions */
    path: `${routes.charts.path}/:id`,
    loadChildren: () =>
      import('../charts-module/charts.module').then((m) => m.ChartsModule),
  },
  {
    /* questionaire for a member */
    path: `${routes.questionaire.path1}/:id/${routes.questionaire.path2}`,
    loadChildren: () =>
      import('../forms-modules/questionaire.module').then(
        (m) => m.QuestionaireModule,
      ),
  },
  {
    /* questionaire edit for a member */
    path: `${routes.questionaire.path1}/:id/${routes.questionaire.path2}/:qid`,
    loadChildren: () =>
      import('../forms-modules/questionaire.module').then(
        (m) => m.QuestionaireModule,
      ),
  },
  {
    /* shows a member's questionaires */
    path: `${routes.questionaires.path}/:id`,
    loadChildren: () =>
      import('../forms-modules/questionaires.module').then(
        (m) => m.QuestionairesModule,
      ),
  },
  {
    /* shows a member's weekly questionaire scores */
    path: `${routes.scores.path}/:id`,
    loadChildren: () =>
      import('../scores-module/scores.module').then((m) => m.ScoresModule),
  },
  {
    /* shows a member's weekly session data */
    path: `${routes.sessions2.path}/:id`,
    loadChildren: () =>
      import('../sessions2-module/sessions2.module').then(
        (m) => m.Sessions2Module,
      ),
  },
  {
    /* shows a member's summary data */
    path: `${routes.summary.path}/:id`,
    loadChildren: () =>
      import('../forms-modules/summary.module').then((m) => m.SummaryModule),
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
