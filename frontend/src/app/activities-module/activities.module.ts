import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';

// import { ActivityResolverService } from './resolvers/activity-resolver.service';
import { ActivitiesResolverService } from './resolvers/activities-resolver.service';
import { ActivityComponent } from './components/activity/activity.component';
import { ActivitiesComponent } from './components/activities/activities.component';

const routes: Routes = [
  {
    path: ``,
    component: ActivitiesComponent,
    canActivate: [AuthGuard],
    resolve: {
      activities: ActivitiesResolverService,
    },
  },
];

@NgModule({
  declarations: [ActivityComponent, ActivitiesComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ActivitiesModule {}
