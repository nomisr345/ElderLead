<<<<<<< HEAD
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProfileSetupPage } from './profile-setup.page';

const routes: Routes = [
  {
    path: '',
    component: ProfileSetupPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfileSetupPageRoutingModule {}
=======
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProfileSetupPage } from './profile-setup.page';

const routes: Routes = [
  {
    path: '',
    component: ProfileSetupPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfileSetupPageRoutingModule {}
>>>>>>> d01a5672c4fa3b4eb521cf85f686634ea7a5ac07
