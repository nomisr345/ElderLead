import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AllActivitiesPageRoutingModule } from './all-activities-routing.module';
import { AllActivitiesPage } from './all-activities.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AllActivitiesPageRoutingModule
  ],
  declarations: [AllActivitiesPage]
})
export class AllActivitiesPageModule {}
