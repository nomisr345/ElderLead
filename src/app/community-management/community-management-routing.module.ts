import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CommunityManagementPage } from './community-management.page';

const routes: Routes = [
  {
    path: '',
    component: CommunityManagementPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CommunityManagementPageRoutingModule {}
