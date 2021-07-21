import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

import { MemberDetailComponent } from '../components/member-detail/member-detail.component';
import { MemberSessionComponent } from '../components/member-session/member-session.component';
import { MemberQuestionaireComponent } from '../components/member-questionaire/member-questionaire.component';
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
import { routes } from '../config';
import { MemberQuestionaireResolverService } from '../shared/resolvers/member-questionaire-resolver.service';
import { MemberQuestionairesResolverService } from '../shared/resolvers/member-questionaires-resolver.service';
import { MemberQuestionairesComponent } from '../components/member-questionaires/member-questionaires.component';
import { MemberScoresComponent } from '../components/member-scores/member-scores.component';
import { MemberScoresResolverService } from '../shared/resolvers/member-scores-resolver.service';

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
    component: MemberSessionComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndSession: MemberSessionResolverService,
    },
  },
  {
    /* session edit for a member */
    path: `${routes.session.path1}/:id/${routes.session.path2}/:sid`,
    component: MemberSessionComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndSession: MemberSessionResolverService,
    },
  },
  {
    /* shows a member's sessions */
    path: `${routes.sessions.path}/:id`,
    component: MemberSessionsComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndSessions: MemberSessionsResolverService,
    },
  },
  {
    /* charts a member's sessions */
    path: `${routes.charts.path}/:id`,
    component: SessionsChartComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndSessions: MemberSessionsResolverService,
    },
  },
  {
    /* questionaire for a member */
    path: `${routes.questionaire.path1}/:id/${routes.questionaire.path2}`,
    component: MemberQuestionaireComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndQuestionaire: MemberQuestionaireResolverService,
    },
  },
  {
    /* questionaire edit for a member */
    path: `${routes.questionaire.path1}/:id/${routes.questionaire.path2}/:qid`,
    component: MemberQuestionaireComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndQuestionaire: MemberQuestionaireResolverService,
    },
  },
  {
    /* shows a member's questionaires */
    path: `${routes.questionaires.path}/:id`,
    component: MemberQuestionairesComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndQuestionaires: MemberQuestionairesResolverService,
    },
  },
  {
    /* shows a member's weekly questionaire scores */
    path: `${routes.scores.path}/:id`,
    component: MemberScoresComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndScores: MemberScoresResolverService,
    },
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
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false }, // true for debugging purposes only
    ),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
