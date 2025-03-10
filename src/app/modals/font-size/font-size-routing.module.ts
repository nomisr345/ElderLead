import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FontSizePage } from './font-size.page';

const routes: Routes = [
  {
    path: '',
    component: FontSizePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FontSizePageRoutingModule {}
