import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';

import { MemberScoresResolverService } from './resolvers/scores-resolver.service';
import { ScoresComponent } from './components/scores.component';

const routes: Routes = [
  {
    path: ``,
    component: ScoresComponent,
    canActivate: [AuthGuard],
    resolve: {
      scores: MemberScoresResolverService,
    },
  },
];

@NgModule({
  declarations: [ScoresComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ScoresModule {}
