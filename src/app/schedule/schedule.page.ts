import { Component, OnInit } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

interface Activity {
  id?: string;
  title: string;
  description: string;
  startTime: string; // Should be in ISO format
  endTime: string;
  location: string;
  category: string;
}

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
  standalone: false,
})
export class SchedulePage implements OnInit {
  selectedDate: string = new Date().toISOString(); // Default to today
  activities!: Observable<Activity[]>; // Fix: definite assignment
  selectedDateActivities: Activity[] = [];

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    this.loadActivities();
  }

  loadActivities() {
    const activitiesCollection = collection(this.firestore, 'activities');
    this.activities = collectionData(activitiesCollection, { idField: 'id' }) as Observable<Activity[]>;

    this.activities.subscribe((activities) => {
      this.filterActivitiesByDate(this.selectedDate, activities);
    });
  }

  onDaySelect(event: any) {
    this.selectedDate = event.detail.value;
    this.activities.subscribe((activities) => {
      this.filterActivitiesByDate(this.selectedDate, activities);
    });
  }

  filterActivitiesByDate(date: string, activities: Activity[]) {
    const selectedDateOnly = date.split('T')[0];
    this.selectedDateActivities = activities.filter((activity) =>
      activity.startTime.startsWith(selectedDateOnly)
    );
  }
}
