import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MembersListComponent } from './components/members-list/members-list.component';
import { MemberDetailComponent } from './components/member-detail/member-detail.component';

/* module routing elements */
const dashboard = {
  path: 'dashboard',
  component: DashboardComponent,
  displayName: 'DASHBOARD',
};
const members = {
  path: 'memberslist',
  component: MembersListComponent,
  displayName: 'MEMBERS',
};
const detail = {
  path: 'detail',
  component: MemberDetailComponent,
  displayName: 'Detail',
};
export const config: any = {
  routes: {
    dashboard,
    members,
    detail,
  },
};
