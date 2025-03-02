import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

declare var google: any;

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false,
})
export class MapsPage implements OnInit {
  mapOptions: google.maps.MapOptions = {
    center: { lat: 1.334, lng: 103.847 }, // Example coordinates
    zoom: 15,
    disableDefaultUI: true, // Hides default controls
  };

  constructor(private navCtrl: NavController) {}

  ngOnInit() {
    this.loadMap();
  }

  loadMap() {
    if (typeof google === 'undefined') {
      console.error('Google Maps API not loaded.');
      return;
    }
    const map = new google.maps.Map(document.getElementById("map") as HTMLElement, this.mapOptions);
  }

  goBack() {
    this.navCtrl.back();
  }
}