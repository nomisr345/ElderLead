import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookedActivitiesService } from '../services/booked-activities.service'; // ✅ Use BookedActivitiesService
import { ActivityService } from '../services/activity.service';
import { Activity } from '../services/models/activity';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-activity-details',
  templateUrl: './activity-details.page.html',
  styleUrls: ['./activity-details.page.scss'],
  standalone: false,
})
export class ActivityDetailsPage implements OnInit {
  activityId: string = '';  // ✅ Avoid undefined errors
  activity: Activity | null = null;
  isBooked: boolean = false;

  constructor(
    private activityService: ActivityService,  // Fetch activity details
    private bookedActivitiesService: BookedActivitiesService,  // ✅ Handle bookings
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    // ✅ Get activity ID from URL
    this.activityId = this.activatedRoute.snapshot.paramMap.get('id')!;
    console.log('Activity ID from route: ', this.activityId);

    // ✅ Load activity details
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
    if (!this.activity || this.isBooked) return; // Prevent booking again

    this.bookedActivitiesService.bookActivity(this.activity).then(() => {
      this.isBooked = true; // ✅ Update button text dynamically
      this.navCtrl.navigateForward(['/activity-confirmation']);
    }).catch(error => {
      console.error('Booking failed:', error);
    });
  }
}
