import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NgxChartsModule } from '@swimlane/ngx-charts';

import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';
import { MemberSummaryResolverService } from './resolvers/summary-resolver.service';
import { SummaryComponent } from './components/summary.component';
import { SummaryChartComponent } from './components/summary-chart/summary-chart.component';

const routes: Routes = [
  {
    path: ``,
    component: SummaryComponent,
    canActivate: [AuthGuard],
    resolve: {
      summary: MemberSummaryResolverService,
    },
  },
];

@NgModule({
  declarations: [SummaryComponent, SummaryChartComponent],
  imports: [NgxChartsModule, RouterModule.forChild(routes), SharedModule],
})
export class SummaryModule {}
