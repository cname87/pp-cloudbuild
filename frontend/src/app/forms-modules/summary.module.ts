import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';
import { FormsBaseModule } from './forms-base.module';
// import { MemberSummaryResolverService } from '../common/resolvers/member-summary-resolver.service';
import { MemberSummaryComponent } from './member-summary/member-summary.component';

const routes: Routes = [
  {
    path: ``,
    component: MemberSummaryComponent,
    canActivate: [AuthGuard],
    // resolve: {
    //   memberAndSummary: MemberSummaryResolverService,
    // },
  },
];

@NgModule({
  declarations: [MemberSummaryComponent],
  imports: [FormsBaseModule, RouterModule.forChild(routes), SharedModule],
})
export class SummaryModule {}
