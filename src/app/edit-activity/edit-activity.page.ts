import { Component, OnInit } from '@angular/core';
import { Activity } from '../services/models/activity';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { NavController } from '@ionic/angular';
import { Timestamp } from '@firebase/firestore';
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { AngularFireStorage } from '@angular/fire/compat/storage'; // Import AngularFireStorage to interact with Firebase Storage

@Component({
  selector: 'app-edit-activity',
  templateUrl: './edit-activity.page.html',
  styleUrls: ['./edit-activity.page.scss'],
  standalone: false,
})
export class EditActivityPage implements OnInit {
  activityId: string = '';
  activity: Activity = new Activity('', '', '', '', '', '', '');
  isUploading = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private activityService: ActivityService,
    private router: Router,
    private navController: NavController,
    private storage: AngularFireStorage // Inject AngularFireStorage service
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

        // Convert Firestore Timestamp to a human-readable date format
        if (activity.date && activity.date instanceof Timestamp) {
          this.activity.date = new Date(activity.date.seconds * 1000).toISOString().split('T')[0];
        }
      },
      (error) => {
        console.error('Error fetching activity:', error);
      }
    );
  }

  async uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.click();  // Trigger the file picker

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
          this.activity.imagePath = downloadURL;  // Store the image URL in the activity object
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
        await this.activityService.update(this.activity); // Update the existing activity
      } else {
        await this.activityService.add(this.activity); // Add a new activity if no ID
      }

      this.router.navigate(['/tabs/admin']); // Redirect after saving
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  }

  goBack() {
    this.navController.back();
  }
}
