import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ActivityConfirmationPage } from './activity-confirmation.page';

const routes: Routes = [
  {
    path: '',
    component: ActivityConfirmationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ActivityConfirmationPageRoutingModule {}
