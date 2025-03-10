import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FontSizeService } from 'src/app/services/font-size.service';

@Component({
  selector: 'app-font-size',
  templateUrl: './font-size.page.html',
  styleUrls: ['./font-size.page.scss'],
  standalone: false,
})
export class FontSizePage {
  currentFontSize: number = 16; // Default font size

  constructor(
    private modalCtrl: ModalController,
    private fontSizeService: FontSizeService
  ) {}

  ionViewWillEnter() {
    // Fetch the current font size from the service when the modal opens
    this.fontSizeService.fontSize$.subscribe((size) => {
      this.currentFontSize = size;
    });
  }

  updateFontSize(event: any) {
    this.currentFontSize = event.detail.value;
    document.documentElement.style.setProperty('--app-font-size', `${this.currentFontSize}px`);

    // Save the updated font size in the service
    this.fontSizeService.setFontSize(this.currentFontSize);
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }
}
