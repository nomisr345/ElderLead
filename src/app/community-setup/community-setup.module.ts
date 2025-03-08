import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommunitySetupPageRoutingModule } from './community-setup-routing.module';
import { CommunitySetupPage } from './community-setup.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CommunitySetupPageRoutingModule,
    CommunitySetupPage // Import instead of declare for standalone components
  ]
  // No declarations array needed for standalone components
})
export class CommunitySetupPageModule {}