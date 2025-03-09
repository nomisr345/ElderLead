import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BookedActivitiesPageRoutingModule } from './booked-activities-routing.module';

import { BookedActivitiesPage } from './booked-activities.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BookedActivitiesPageRoutingModule
  ],
  declarations: [BookedActivitiesPage]
})
export class BookedActivitiesPageModule {}
