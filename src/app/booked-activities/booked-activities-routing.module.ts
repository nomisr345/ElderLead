import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BookedActivitiesPage } from './booked-activities.page';

const routes: Routes = [
  {
    path: '',
    component: BookedActivitiesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BookedActivitiesPageRoutingModule {}
