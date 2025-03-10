import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Timestamp } from '@firebase/firestore';
import { AlertController, ToastController } from '@ionic/angular';
import { ActivityService } from '../services/activity.service';
import { SchemeService } from '../services/scheme.service';
import { Activity } from '../services/models/activity';
import { Scheme } from '../services/models/scheme';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false,
  providers: [DatePipe],
})
export class AdminPage {
  selectedSection: string = 'activities'; // Default section
  searchQuery: string = ''; // Single search input for both activities and schemes

  activities: Activity[] = [];
  filteredActivities: Activity[] = [];

  schemes: Scheme[] = [];
  filteredSchemes: Scheme[] = [];

  constructor(
    private activityService: ActivityService,
    private schemeService: SchemeService,
    private startTimePipe: DatePipe,  
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadActivities();
    this.loadSchemes();
  }

  // Load Activities
  loadActivities() {
    this.activityService.getActivities().subscribe((data: Activity[]) => {
      this.activities = data;
      this.filteredActivities = data;

      this.activities.forEach((activity) => {
        if (activity.startTime && activity.startTime instanceof Timestamp) {
          activity.startTime = this.startTimePipe.transform(activity.startTime.toDate(), 'longDate') || '';
        }
      });
    });
  }

  // Load Schemes
  loadSchemes() {
    this.schemeService.getSchemes().subscribe((data: Scheme[]) => {
      this.schemes = data;
      this.filteredSchemes = data;
    });
  }

  // Filter Activities
  filterActivity() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredActivities = this.activities;
    } else {
      this.filteredActivities = this.activities.filter(activity =>
        activity.title.toLowerCase().includes(query)
      );
    }
  }

  // Filter Schemes
  filterSchemes() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredSchemes = this.schemes;
    } else {
      this.filteredSchemes = this.schemes.filter(scheme =>
        scheme.title.toLowerCase().includes(query)
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

  async deleteScheme(activity: any) {
    const alert = await this.alertController.create({
      header: 'Delete Scheme',
      message: `Are you sure you want to delete the Scheme: ${activity.title}?`,
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
              await this.schemeService.delete(activity);
              // Show the success notification
              const toast = await this.toastController.create({
                message: 'Scheme deleted successfully!',
                duration: 2000,
                color: 'success',
              });
              toast.present();
              // Reload rewards after deletion
              this.loadActivities();
            } catch (error) {
              const toast = await this.toastController.create({
                message: 'Failed to delete the scheme. Please try again.',
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
