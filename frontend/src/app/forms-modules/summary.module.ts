import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NgxChartsModule } from '@swimlane/ngx-charts';

import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';
import { FormsBaseModule } from './forms-base.module';
// import { MemberSummaryResolverService } from '../common/resolvers/member-summary-resolver.service';
import { MemberSummaryComponent } from './member-summary/member-summary.component';
import { SummaryChartComponent } from './member-summary/summary-chart/summary-chart.component';

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
  declarations: [MemberSummaryComponent, SummaryChartComponent],
  imports: [
    FormsBaseModule,
    NgxChartsModule,
    RouterModule.forChild(routes),
    SharedModule,
  ],
})
export class SummaryModule {}
