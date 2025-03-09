import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ResourceHubPageRoutingModule } from './resource-hub-routing.module';

import { ResourceHubPage } from './resource-hub.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ResourceHubPageRoutingModule
  ],
  declarations: [ResourceHubPage]
})
export class ResourceHubPageModule {}
