import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../router-module/guards/auth.guard';

// import { ActivityResolverService } from './resolvers/activity-resolver.service';
import { ActivityLogResolverService } from './resolvers/activity-log-resolver.service';
import { ActivityLogComponent } from './components/activity-log.component';
// import { ActivitiesComponent } from './components/activities/activities.component';

const routes: Routes = [
  {
    /* path if no additional route supplied */
    path: ``,
    component: ActivityLogComponent,
    canActivate: [AuthGuard],
    resolve: {
      activities: ActivityLogResolverService,
    },
    children: [
      {
        path: 'activity/:aid',
        component: ActivityLogComponent,
      },
    ],
  },
  {
    /**
     * * TO DO  */
    /* otherwise shows the information page, defaulting to page not found */
    path: '**',
    component: ActivityLogComponent,
    canActivate: [AuthGuard],
    resolve: {
      activities: ActivityLogResolverService,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SummaryRoutingModule {}
