import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-community-management',
  templateUrl: './community-management.page.html',
  styleUrls: ['./community-management.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})

export class CommunityManagementPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}