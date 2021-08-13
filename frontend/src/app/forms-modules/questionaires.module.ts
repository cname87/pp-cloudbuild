import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';
import { FormsBaseModule } from './forms-base.module';
import { MemberQuestionairesResolverService } from '../common/resolvers/member-questionaires-resolver.service';
import { MemberQuestionairesComponent } from './member-questionaires/member-questionaires.component';

const routes: Routes = [
  {
    path: ``,
    component: MemberQuestionairesComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndQuestionaires: MemberQuestionairesResolverService,
    },
  },
];

@NgModule({
  declarations: [MemberQuestionairesComponent],
  imports: [FormsBaseModule, RouterModule.forChild(routes), SharedModule],
})
export class QuestionairesModule {}
