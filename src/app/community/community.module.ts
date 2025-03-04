import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommunityPageRoutingModule } from './community-routing.module';
import { CommunityPage } from './community.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CommunityPageRoutingModule,
    CommunityPage // Import instead of declare
  ]
  // Remove declarations array
})
export class CommunityPageModule {}