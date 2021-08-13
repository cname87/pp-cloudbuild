import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';
import { FormsBaseModule } from './forms-base.module';
import { MemberQuestionaireResolverService } from '../common/resolvers/member-questionaire-resolver.service';
import { MemberQuestionaireComponent } from './member-questionaire/member-questionaire.component';

const routes: Routes = [
  {
    path: ``,
    component: MemberQuestionaireComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndQuestionaire: MemberQuestionaireResolverService,
    },
  },
];

@NgModule({
  declarations: [MemberQuestionaireComponent],
  imports: [FormsBaseModule, RouterModule.forChild(routes), SharedModule],
})
export class QuestionaireModule {}
