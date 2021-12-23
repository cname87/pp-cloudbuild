import { NgModule } from '@angular/core';
import { SharedModule } from '../shared-module/shared.module';
import { ActivityLogComponent } from './components/activity-log.component';
import { ActivityComponent } from './components/activity/activity.component';
import { ActivitiesComponent } from './components/activities/activities.component';
import { SummaryRoutingModule } from './activities.routing.module';

@NgModule({
  declarations: [ActivityLogComponent, ActivityComponent, ActivitiesComponent],
  imports: [SharedModule, SummaryRoutingModule],
})
export class ActivitiesModule {}
