import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MyActivitiesPageRoutingModule } from './my-activities-routing.module';

import { MyActivitiesPage } from './my-activities.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MyActivitiesPageRoutingModule
  ],
  declarations: [MyActivitiesPage]
})
export class MyActivitiesPageModule {}
