import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';

import { MemberSessionsResolverService } from './resolvers/member-sessions-resolver.service';
import { MemberSessionsComponent } from './components/member-sessions.component';
import { DatatableTypeComponent } from './components/datatable.type';

const routes: Routes = [
  {
    path: ``,
    component: MemberSessionsComponent,
    canActivate: [AuthGuard],
    resolve: {
      sessions: MemberSessionsResolverService,
    },
  },
];

@NgModule({
  declarations: [DatatableTypeComponent, MemberSessionsComponent],
  imports: [SharedModule, RouterModule.forChild(routes), NgxDatatableModule],
})
export class SessionsModule {}
