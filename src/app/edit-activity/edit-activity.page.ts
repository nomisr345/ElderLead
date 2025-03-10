import { Component, OnInit } from '@angular/core';
import { Activity } from '../services/models/activity';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { NavController } from '@ionic/angular';
import { Timestamp } from '@firebase/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-edit-activity',
  templateUrl: './edit-activity.page.html',
  styleUrls: ['./edit-activity.page.scss'],
  standalone: false,
})
export class EditActivityPage implements OnInit {
  activityId: string = '';
  activity: Activity = new Activity('', '', '', '', '', '', '', '', '',''); // Adjusted constructor
  isUploading = false;
  today: string = new Date().toISOString().split('T')[0]; 

  constructor(
    private activatedRoute: ActivatedRoute,
    private activityService: ActivityService,
    private router: Router,
    private navController: NavController,
    private storage: AngularFireStorage
  ) {}

  ngOnInit() {
    this.activityId = this.activatedRoute.snapshot.paramMap.get('id') || '';
    if (this.activityId) {
      this.loadActivity(this.activityId);
    }
  }

  loadActivity(id: string) {
    this.activityService.getActivityById(id).subscribe(
      (activity: Activity) => {
        this.activity = activity;

        // Convert Firestore Timestamps to ISO string for input binding
        if (activity.startTime) {
          this.activity.startTime = this.convertToDateTimeString(activity.startTime);
        }
        if (activity.endTime) {
          this.activity.endTime = this.convertToDateTimeString(activity.endTime);
        }
      },
      (error) => {
        console.error('Error fetching activity:', error);
      }
    );
  }

  convertToDateTimeString(date: any): string {
    if (date instanceof Date) {
      return date.toISOString(); // Get full ISO string (including date and time)
    } else if (typeof date === 'string') {
      // If it's already a string, check if it's missing the time part
      if (date.length === 10) {
        // Assume time should be 00:00:00 for missing time part
        return date + "T00:00:00";
      }
      return date; // Already in correct format
    }
    return '';
  }

  async uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.click();

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        try {
          this.isUploading = true;
          const filePath = `activity_images/${new Date().getTime()}_${file.name}`;
          const fileRef = this.storage.ref(filePath);
          const task = this.storage.upload(filePath, file);

          await task;
          const downloadURL = await fileRef.getDownloadURL().toPromise();
          this.activity.imagePath = downloadURL;
          this.isUploading = false;
        } catch (error) {
          console.error('Error uploading image:', error);
          this.isUploading = false;
        }
      }
    };
  }

  async saveActivity() {
    try {
      if (this.activityId) {
        await this.activityService.update(this.activity);
      } else {
        await this.activityService.add(this.activity);
      }

      this.router.navigate(['/tabs/admin']);
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  }

  goBack() {
    this.navController.back();
  }
}
