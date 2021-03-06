import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../router-module/guards/auth.guard';

import { ActivitiesResolverService } from './resolvers/activities-resolver.service';
import { ActivitiesParentComponent } from './components/activities-parent.component';
import { InformationComponent } from '../app-module/components/information/information.component';

const routes: Routes = [
  {
    /* path if no additional route supplied */
    path: ``,
    component: ActivitiesParentComponent,
    canActivate: [AuthGuard],
    resolve: {
      activities: ActivitiesResolverService,
    },
    children: [
      {
        path: 'activity/:aid',
        component: ActivitiesParentComponent,
      },
    ],
  },
  {
    /* otherwise shows the information page, defaulting to page not found */
    path: '**',
    component: InformationComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ActivitiesRoutingModule {}
