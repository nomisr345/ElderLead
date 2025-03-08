import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActivityService } from '../services/activity.service';  // Adjust the path as necessary
import { Activity } from '../services/models/activity';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-activity-details',
  templateUrl: './activity-details.page.html',
  styleUrls: ['./activity-details.page.scss'],
  standalone: false,
})
export class ActivityDetailsPage implements OnInit {
  activityId: string = '';  // Initialize as empty string to avoid undefined errors
  activity: Activity | null = null;

  constructor(
    private activityService: ActivityService,
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    // Retrieve the activity ID from the URL (assuming the ID is passed via router)
    this.activityId = this.activatedRoute.snapshot.paramMap.get('id')!;
    console.log('Activity ID from route: ', this.activityId);

    // Call loadActivity method to load the activity by id
    this.loadActivity();
  }

  loadActivity() {
    if (this.activityId) {
      this.activityService.getActivityById(this.activityId).subscribe(
        (activity) => {
          this.activity = activity;
          console.log('Loaded activity: ', this.activity);
        },
        (error) => {
          console.error('Error loading activity: ', error);
        }
      );
    } else {
      console.error('Activity ID is missing!');
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  bookNow() {
    this.navCtrl.navigateForward(['/activity-confirmation']);
  }

}
