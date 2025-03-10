import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddSchemePage } from './add-scheme.page';

const routes: Routes = [
  {
    path: '',
    component: AddSchemePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddSchemePageRoutingModule {}
