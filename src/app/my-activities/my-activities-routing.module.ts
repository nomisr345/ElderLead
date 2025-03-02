import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyActivitiesPage } from './my-activities.page';

const routes: Routes = [
  {
    path: '',
    component: MyActivitiesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MyActivitiesPageRoutingModule {}
