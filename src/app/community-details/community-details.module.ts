import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommunityDetailsPageRoutingModule } from './community-details-routing.module';
import { CommunityDetailsPage } from './community-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CommunityDetailsPageRoutingModule,
    CommunityDetailsPage // Import instead of declare for standalone components
  ]
  // No declarations array needed for standalone components
})
export class CommunityDetailsPageModule {}