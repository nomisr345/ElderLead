import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ProfileSetupPageRoutingModule } from './profile-setup-routing.module';
import { ProfileSetupPage } from './profile-setup.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ProfileSetupPageRoutingModule,
    ProfileSetupPage // Import instead of declare for standalone components
  ],
  // No declarations array needed for standalone components
})
export class ProfileSetupPageModule {}  // <- This class name needs to match what you're importing