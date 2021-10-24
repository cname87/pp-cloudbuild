import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';

import { MemberScoresResolverService } from './resolvers/member-scores-resolver.service';
import { MemberScoresComponent } from './components/member-scores.component';
import { DatatableTypeComponent } from './components/datatable.type';

const routes: Routes = [
  {
    path: ``,
    component: MemberScoresComponent,
    canActivate: [AuthGuard],
    resolve: {
      scores: MemberScoresResolverService,
    },
  },
];

@NgModule({
  declarations: [DatatableTypeComponent, MemberScoresComponent],
  imports: [SharedModule, RouterModule.forChild(routes), NgxDatatableModule],
})
export class ScoresModule {}
