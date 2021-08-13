import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';
import { FormsBaseModule } from '../forms-modules/forms-base.module';

import { MemberScoresResolverService } from '../common/resolvers/member-scores-resolver.service';
import { MemberScoresComponent } from './member-scores/member-scores.component';
import { DatatableTypeComponent } from './member-scores/datatable.type';

const routes: Routes = [
  {
    path: ``,
    component: MemberScoresComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndScores: MemberScoresResolverService,
    },
  },
];

@NgModule({
  declarations: [DatatableTypeComponent, MemberScoresComponent],
  imports: [
    SharedModule,
    FormsBaseModule,
    RouterModule.forChild(routes),
    NgxDatatableModule,
  ],
})
export class ScoresModule {}
