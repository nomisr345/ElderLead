import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-activity-confirmation',
  templateUrl: './activity-confirmation.page.html',
  styleUrls: ['./activity-confirmation.page.scss'],
  standalone: true, 
  imports: [CommonModule, IonicModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ActivityConfirmationPage {
  // Activity data
  activity: { title?: string } | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Retrieve activity title from route parameters
    this.route.queryParams.subscribe(params => {
      if (params && params['title']) {
        this.activity = {
          title: params['title']
        };
      }
    });
  }

  viewActivities() {
    // Navigate to the activities page
    this.router.navigate(['/my-activities']);
  }

  backToActivities() {
    // Navigate back to the activities list
    this.router.navigate(['/tabs/activities']);
  }
}