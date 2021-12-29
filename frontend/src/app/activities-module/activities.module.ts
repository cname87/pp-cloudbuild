import { NgModule } from '@angular/core';
import { SharedModule } from '../shared-module/shared.module';
import { ActivitiesParentComponent } from './components/activities-parent.component';
import { ActivityComponent } from './components/activity/activity.component';
import { ActivitiesComponent } from './components/activities/activities.component';
import { ActivitiesRoutingModule } from './activities.routing.module';

@NgModule({
  declarations: [
    ActivitiesParentComponent,
    ActivityComponent,
    ActivitiesComponent,
  ],
  imports: [SharedModule, ActivitiesRoutingModule],
})
export class ActivitiesModule {}
