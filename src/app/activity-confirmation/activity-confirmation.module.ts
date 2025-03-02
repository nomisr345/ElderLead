import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ActivityConfirmationPageRoutingModule } from './activity-confirmation-routing.module';

import { ActivityConfirmationPage } from './activity-confirmation.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ActivityConfirmationPageRoutingModule
  ],
  declarations: []
})
export class ActivityConfirmationPageModule {}
