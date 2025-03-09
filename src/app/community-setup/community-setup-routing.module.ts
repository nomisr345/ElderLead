import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CommunitySetupPage } from './community-setup.page';

const routes: Routes = [
  {
    path: '',
    component: CommunitySetupPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CommunitySetupPageRoutingModule {}
