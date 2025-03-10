import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddSchemePageRoutingModule } from './add-scheme-routing.module';

import { AddSchemePage } from './add-scheme.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddSchemePageRoutingModule
  ],
  declarations: [AddSchemePage]
})
export class AddSchemePageModule {}
