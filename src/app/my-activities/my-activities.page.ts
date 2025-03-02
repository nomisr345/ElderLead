import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-my-activities',
  templateUrl: './my-activities.page.html',
  styleUrls: ['./my-activities.page.scss'],
  standalone: false,
})
export class MyActivitiesPage implements OnInit {
  selectedSegment: string = 'upcoming';
  detailsVisible: boolean = false;

  toggleDetails() {
    this.detailsVisible = !this.detailsVisible;
  }

  constructor(private navCtrl: NavController, private router: Router) {}

  ngOnInit() {
  }

  goBack() {
    this.navCtrl.back();
  }

  goToMaps() {
    this.router.navigate(['/maps']);
  }


}
