import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';

@Component({
  selector: 'app-event-details',
  standalone: true, 
  imports: [CommonModule, IonicModule], 
  templateUrl: './event-details.page.html',
  styleUrls: ['./event-details.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EventDetailsPage {

  constructor(private navCtrl: NavController) {}

  goBack() {
    this.navCtrl.back();
  }

  bookNow() {
    this.navCtrl.navigateForward(['/activity-confirmation']);
  }
}
