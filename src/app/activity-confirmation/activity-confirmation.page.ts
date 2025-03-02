import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-activity-confirmation',
  templateUrl: './activity-confirmation.page.html',
  styleUrls: ['./activity-confirmation.page.scss'],
  standalone: true, 
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ActivityConfirmationPage {

  constructor(private router: Router) {}

  viewActivities() {
    // Navigate to the activities page
    this.router.navigate(['/my-activities']);
  }

  backToActivities() {
    // Navigate back to the activities list
    this.router.navigate(['/tabs/activities']);
  }
} 