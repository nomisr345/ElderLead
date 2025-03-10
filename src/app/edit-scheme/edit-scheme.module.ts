import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditSchemePageRoutingModule } from './edit-scheme-routing.module';

import { EditSchemePage } from './edit-scheme.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditSchemePageRoutingModule
  ],
  declarations: [EditSchemePage]
})
export class EditSchemePageModule {}
