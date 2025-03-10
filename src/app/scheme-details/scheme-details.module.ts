import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SchemeDetailsPageRoutingModule } from './scheme-details-routing.module';

import { SchemeDetailsPage } from './scheme-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SchemeDetailsPageRoutingModule
  ],
  declarations: [SchemeDetailsPage]
})
export class SchemeDetailsPageModule {}
