import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NgxChartsModule } from '@swimlane/ngx-charts';

import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';
import { MemberSessionsResolverService } from '../common/resolvers/member-sessions-resolver.service';
import { SessionsChartComponent } from './sessions-chart/sessions-chart.component';

const routes: Routes = [
  {
    /* charts a member's sessions */
    path: ``,
    component: SessionsChartComponent,
    canActivate: [AuthGuard],
    resolve: {
      memberAndSessions: MemberSessionsResolverService,
    },
  },
];

@NgModule({
  declarations: [SessionsChartComponent],
  imports: [NgxChartsModule, RouterModule.forChild(routes), SharedModule],
})
export class ChartsModule {}
