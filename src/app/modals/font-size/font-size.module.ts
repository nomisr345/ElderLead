import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FontSizePageRoutingModule } from './font-size-routing.module';

import { FontSizePage } from './font-size.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FontSizePageRoutingModule
  ],
  declarations: [FontSizePage]
})
export class FontSizePageModule {}
