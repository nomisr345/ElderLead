import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommunityChatPageRoutingModule } from './community-chat-routing.module';
import { CommunityChatPage } from './community-chat.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CommunityChatPageRoutingModule,
    CommunityChatPage // Import instead of declare for standalone components
  ]
  // No declarations array needed for standalone components
})
export class CommunityChatPageModule {}