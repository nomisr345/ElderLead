import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ResourceHubPage } from './resource-hub.page';

const routes: Routes = [
  {
    path: '',
    component: ResourceHubPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ResourceHubPageRoutingModule {}
