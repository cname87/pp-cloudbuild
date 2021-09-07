import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { SharedModule } from '../shared-module/shared.module';
import { AuthGuard } from '../router-module/guards/auth.guard';
import { FormsBaseModule } from '../forms-modules/forms-base.module';

import { MemberSessions2ResolverService } from '../common/resolvers/member-sessions2-resolver.service';
import { MemberSessions2Component } from './member-sessions2/member-sessions2.component';
import { DatatableTypeComponent } from './member-sessions2/datatable.type';

const routes: Routes = [
  {
    path: ``,
    component: MemberSessions2Component,
    canActivate: [AuthGuard],
    resolve: {
      memberAndSessions: MemberSessions2ResolverService,
    },
  },
];

@NgModule({
  declarations: [DatatableTypeComponent, MemberSessions2Component],
  imports: [
    SharedModule,
    FormsBaseModule,
    RouterModule.forChild(routes),
    NgxDatatableModule,
  ],
})
export class Sessions2Module {}
