import { Component } from '@angular/core';
import { ActivityService } from 'src/app/services/activity.service';
import { Activity } from '../services/models/activity';
import { Router } from '@angular/router';


@Component({
  selector: 'app-add-activity',
  templateUrl: './add-activity.page.html',
  styleUrls: ['./add-activity.page.scss'],
  standalone: false,
})
export class AddActivityPage {
  newActivity: Activity = new Activity('', '','', '', '', '');
  today = new Date().toISOString();

  constructor(private activityService: ActivityService, private router: Router) {}

  add(activityForm: any) {
    if (activityForm.valid) {
      this.activityService.add(this.newActivity)
        .then(() => {
          // Handle success (e.g., show a success message or navigate)
          console.log('Activity added successfully');
        })
        .catch((error) => {
          // Handle error
          console.error('Error adding activity:', error);
        });

        this.router.navigate(['/tabs/admin']);
    }
  }

  uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.click();  // Trigger the file picker

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.readFile(file);
      }
    };
  }

  // Helper method to read the file as a data URL (base64)
  readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.newActivity.imagePath = reader.result as string;  // Save base64 image to the model
    };
    reader.readAsDataURL(file);  // Read the file as a data URL
  }
}
