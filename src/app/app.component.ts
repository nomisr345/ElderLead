import { Component } from '@angular/core';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private menuCtrl: MenuController) {}

  async openMore() {
    await this.menuCtrl.open('start');
  }

  async closeMenu() {
    await this.menuCtrl.close('start');
  }
}
