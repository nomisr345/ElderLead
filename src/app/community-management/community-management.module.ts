import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommunityManagementPageRoutingModule } from './community-management-routing.module';
import { CommunityManagementPage } from './community-management.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CommunityManagementPageRoutingModule,
    CommunityManagementPage // Import instead of declare for standalone components
  ]
  // No declarations array needed for standalone components
})
export class CommunityManagementPageModule {}