import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../router-module/guards/auth.guard';

import { SessionsResolverService } from './resolvers/sessions-resolver.service';
import { SessionsParentComponent } from './components/sessions-parent.component';
import { InformationComponent } from '../app-module/components/information/information.component';

const routes: Routes = [
  {
    /* path if no additional route supplied */
    path: ``,
    component: SessionsParentComponent,
    canActivate: [AuthGuard],
    resolve: {
      sessions: SessionsResolverService,
    },
    children: [
      {
        path: 'session/:sid',
        component: SessionsParentComponent,
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
export class SessionsRoutingModule {}
