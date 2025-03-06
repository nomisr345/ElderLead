import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../services/activity.service'; // Import the service
import { Activity } from '../services/models/activity';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-all-activities',
  templateUrl: './all-activities.page.html',
  styleUrls: ['./all-activities.page.scss'],
  standalone: false,
})
export class AllActivitiesPage implements OnInit {
  activities: Activity[] = [];
  filteredActivities: Activity[] = [];
  searchQuery: string = '';

  constructor(private activityService: ActivityService, private navCtrl: NavController, private router: Router) {}

  ngOnInit() {
    // Fetch activities on component initialization
    this.activityService.getActivities().subscribe((activities) => {
      this.activities = activities;
      this.filteredActivities = [...this.activities];
    });
  }

  filterActivities(event: any) {
    const query = event.target.value?.toLowerCase() || '';
    
    if (!query.trim()) {
      this.filteredActivities = [...this.activities];
      return;
    }

    this.filteredActivities = this.activities.filter(activity =>
      activity.title.toLowerCase().includes(query)
    );
  }

  goBack() {
    this.navCtrl.back();
  }

  goToActivityDetails(activityId: string) {
    this.router.navigate(['/activity-details', activityId]);  // Navigates to the activity details page with the ID
  }
}
