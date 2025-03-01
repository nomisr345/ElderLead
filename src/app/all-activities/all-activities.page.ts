import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-all-activities',
  templateUrl: './all-activities.page.html',
  styleUrls: ['./all-activities.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AllActivitiesPage implements OnInit {

  constructor(private navController: NavController) { }

  ngOnInit() {
  }

  goBack() {
    this.navController.back(); // Navigate back to the previous page
  }

}
