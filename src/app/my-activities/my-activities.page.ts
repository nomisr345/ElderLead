import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { BookedActivitiesService } from '../services/booked-activities.service';
import { Activity } from '../services/models/activity';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-my-activities',
  templateUrl: './my-activities.page.html',
  styleUrls: ['./my-activities.page.scss'],
  standalone: false,
})
export class MyActivitiesPage implements OnInit {
  bookedActivities: Activity[] = [];
  segment: string = 'upcoming'; // Default segment to 'upcoming'
  filteredActivities: Activity[] = [];
  userId: string | null = null; // Holds the current user's ID

  constructor(
    private bookedActivitiesService: BookedActivitiesService, 
    private navCtrl: NavController, 
    private router: Router,
  private authService: AuthService) {}

  async ngOnInit() {
    try {
      // Fetch current user and load booked activities when the page is initialized
      const user = await this.authService.getCurrentUser(); // Await the promise
      if (user) {
        this.userId = user.uid;
        this.loadBookedActivities();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }

  // Load all booked activities for the user
  loadBookedActivities() {
    if (this.userId) {
      this.bookedActivitiesService.getBookedActivitiesForUser(this.userId).subscribe((activities) => {
        this.bookedActivities = activities;
        this.filterActivities();
      });
    }
  }

  // Filter activities based on the selected segment
  segmentChanged(event: any) {
    this.filterActivities();
  }

  filterActivities() {
    const now = new Date();
    if (this.segment === 'upcoming') {
      this.filteredActivities = this.bookedActivities.filter(
        (activity) => new Date(activity.startTime) > now
      );
    } else {
      this.filteredActivities = this.bookedActivities.filter(
        (activity) => new Date(activity.startTime) <= now
      );
    }
  }

  // Check if the activity is upcoming
  isUpcoming(activity: Activity): boolean {
    const now = new Date();
    return new Date(activity.startTime) > now;
  }

  // Method to toggle the dropdown
  toggleDropdown(activity: Activity) {
    activity.expanded = !activity.expanded;
  }

  // Cancel the session
  async cancelSession(activity: Activity) {
    try {
      await this.bookedActivitiesService.cancelSession(activity);
      this.loadBookedActivities();
      console.log('Session canceled successfully!');
    } catch (error) {
      console.error('Failed to cancel session', error);
    }
  }

  goToActivityDetails(activityId: string) {
    this.router.navigate(['/booked-activities', activityId]);  // Navigates to the activity details page with the ID
  }
  

  goBack() {
    this.navCtrl.back();
  }
}