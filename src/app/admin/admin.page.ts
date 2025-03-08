import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../services/activity.service';
import { Activity } from '../services/models/activity';
import { DatePipe } from '@angular/common';
import { AlertController, ToastController } from '@ionic/angular';
import { Timestamp } from 'firebase/firestore';
import 'firebase/firestore'; // Import Firestore module


@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false,
  providers: [DatePipe],
})
export class AdminPage implements OnInit {
  activities: Activity[] = [];
  filteredActivities: Activity[] = []; // activitys after filtering
  searchQuery: string = ''; // Search input value

  constructor(private activityService: ActivityService,
    private datePipe: DatePipe,  
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadActivities();
  }

 
  loadActivities() {
    this.activityService.getActivities().subscribe((data: Activity[]) => {
      this.activities = data;
      this.filteredActivities = data; // Initialize filteredactivitys
      // Convert Firestore Timestamps to human-readable dates
      this.activities.forEach((activity) => {
        if (activity.date && activity.date instanceof Timestamp) {
          activity.date = this.datePipe.transform(activity.date.toDate(), 'longDate') || '';
        }
      });
    });
  }

  
  filterActivity() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      // If no search query, show all rewards
      this.filteredActivities = this.activities;
    } else {
      // Filter rewards by title
      this.filteredActivities = this.activities.filter((activity) =>
        activity.title.toLowerCase().includes(query)
      );
    }
  }

  async deleteActivity(activity: any) {
    const alert = await this.alertController.create({
      header: 'Delete Activity',
      message: `Are you sure you want to delete the Activity: ${activity.title}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Cancel delete');
          },
        },
        {
          text: 'Delete',
          handler: async () => {
            try {
              await this.activityService.delete(activity);
              // Show the success notification
              const toast = await this.toastController.create({
                message: 'Activity deleted successfully!',
                duration: 2000,
                color: 'success',
              });
              toast.present();
              // Reload rewards after deletion
              this.loadActivities();
            } catch (error) {
              const toast = await this.toastController.create({
                message: 'Failed to delete the activity. Please try again.',
                duration: 2000,
                color: 'danger',
              });
              toast.present();
            }
          },
        },
      ],
    });

    await alert.present();
  }
}
