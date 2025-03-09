import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../services/activity.service';
import { Activity } from '../services/models/activity';
import { Router } from '@angular/router';

@Component({
  selector: 'app-activities',
  templateUrl: './activities.page.html',
  styleUrls: ['./activities.page.scss'],
  standalone: false,
})
export class ActivitiesPage implements OnInit {
  activities: Activity[] = [];  // Stores all activities
  filteredEvents: Activity[] = []; // Stores filtered activities

  constructor(private activityService: ActivityService, private router: Router) {}

  ngOnInit() {
    this.loadActivities();
  }

  // Fetch activities from Firebase
  loadActivities() {
    this.activityService.getActivities().subscribe((data) => {
      this.activities = data.map(activity => ({
        ...activity,
        date: this.formatDate(activity.date) // Format the date before storing
      }));
      this.filteredEvents = [...this.activities]; // Ensure filtered list is updated
    });
  }

  // Format Firestore Timestamp to human-readable date format
  formatDate(date: any): string {
    if (date?.toDate) {
      const jsDate = date.toDate(); // Convert Firestore Timestamp to JavaScript Date
      return jsDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } else if (typeof date === 'string' || date instanceof Date) {
      return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    return ''; // Return empty string if no valid date
  }

  // Determine badge class based on category
  getBadgeClass(category: string): string {
    switch (category) {
      case 'Exercise': return 'exercise-badge';
      case 'Social': return 'social-badge';
      case 'Learning': return 'learning-badge';
      default: return 'default-badge';
    }
  }

  // Filter events based on the search query
  filterEvents(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredEvents = this.activities.filter((activity) =>
      activity.title.toLowerCase().includes(query) ||
      activity.category.toLowerCase().includes(query) ||
      activity.location.toLowerCase().includes(query)
    );
  }

  // Filter events by category
  filterByCategory(category: string) {
    this.filteredEvents = this.activities.filter((activity) =>
      activity.category === category
    );
  }

  // Clear category filter and show all activities
  clearAllFilters() {
    // Clear any active category filters and reset to all activities
    this.filteredEvents = [...this.activities]; // Reset the filter
  }
  
  
  // Navigate to all activities page
  navigateToAllActivities() {
    this.router.navigate(['/all-activities']);
  }
  
  goToActivityDetails(activityId: string) {
    this.router.navigate(['/activity-details', activityId]);  // Navigates to the activity details page with the ID
  }
}
