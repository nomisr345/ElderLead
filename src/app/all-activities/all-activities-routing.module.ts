import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AllActivitiesPage } from './all-activities.page';

const routes: Routes = [
  {
    path: '',
    component: AllActivitiesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AllActivitiesPageRoutingModule {}
