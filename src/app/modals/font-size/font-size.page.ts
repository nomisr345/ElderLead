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
  ) {
    this.fontSizeService.fontSize$.subscribe((size) => {
      this.currentFontSize = size;
    });
  }

  updateFontSize(event: any) {
    this.currentFontSize = event.detail.value;
    document.documentElement.style.setProperty('--app-font-size', `${this.currentFontSize}px`);
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }
}
