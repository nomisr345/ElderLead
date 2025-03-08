<<<<<<< HEAD
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
=======
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
>>>>>>> d01a5672c4fa3b4eb521cf85f686634ea7a5ac07
export class CommunityPageModule {}