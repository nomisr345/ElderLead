import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookedActivitiesService } from '../services/booked-activities.service';
import { Activity } from '../services/models/activity';
import { NavController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-booked-activities',
  templateUrl: './booked-activities.page.html',
  styleUrls: ['./booked-activities.page.scss'],
  standalone: false,  
})
export class BookedActivitiesPage implements OnInit {
  activity: Activity | null = null;
  isBooked: boolean = false; // Track whether the activity is booked

  constructor(
    private activatedRoute: ActivatedRoute,
    private bookedActivitiesService: BookedActivitiesService,
    private router: Router,
    private navCtrl: NavController,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    const activityId = this.activatedRoute.snapshot.paramMap.get('id');
    if (activityId) {
      this.loadActivityDetails(activityId);
    }
  }

  // Fetch the details of the booked activity using its ID
  loadActivityDetails(activityId: string) {
    this.bookedActivitiesService.getBookedActivityById(activityId).subscribe((activity) => {
      this.activity = activity;
    });
  }

  checkIfBooked(activityId: string) {
    this.authService.getCurrentUser().then((currentUser) => {
      if (!currentUser) {
        return;
      }

      // Fetch bookings for this user and check if the activity is booked
      this.bookedActivitiesService.getBookedActivities().subscribe((bookedActivities) => {
        this.isBooked = bookedActivities.some((booking) => booking.id === activityId);
      });
    });
  }

  // Go back to the previous page
  goBack() {
    this.navCtrl.back();
  }
}
