import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditActivityPage } from './edit-activity.page';

const routes: Routes = [
  {
    path: '',
    component: EditActivityPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditActivityPageRoutingModule {}
