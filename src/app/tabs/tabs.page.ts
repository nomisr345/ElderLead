import { Component } from '@angular/core';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage {

  constructor(private menuCtrl: MenuController) {}

  async openMenu() {
    await this.menuCtrl.enable(true, 'main-menu'); // Ensure menu is enabled
    await this.menuCtrl.open('main-menu'); // Open menu
  }
}
