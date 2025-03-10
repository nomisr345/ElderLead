import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SchemeService } from '../services/scheme.service';
import { NavController } from '@ionic/angular';
import { Scheme } from '../services/models/scheme';
import { AngularFireStorage } from '@angular/fire/compat/storage'; // Import AngularFireStorage to interact with Firebase Storage

@Component({
  selector: 'app-edit-scheme',
  templateUrl: './edit-scheme.page.html',
  styleUrls: ['./edit-scheme.page.scss'],
  standalone: false,
})
export class EditSchemePage implements OnInit {
  schemeId: string = '';
  scheme: Scheme = new Scheme('', '', '', '', '', '', '',''); // Initialize scheme with empty fields
  today: string = new Date().toISOString().split('T')[0]; // Set today's date for min date validation
  isUploading = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private schemeService: SchemeService,
    private router: Router,
    private navController: NavController,
    private storage: AngularFireStorage // Inject AngularFireStorage service
  ) {}

  ngOnInit() {
    this.schemeId = this.activatedRoute.snapshot.paramMap.get('id') || '';
    if (this.schemeId) {
      this.loadScheme(this.schemeId);
    }
  }

  // Load existing scheme data by ID
 // Load the scheme data
// Load the scheme data
loadScheme(id: string) {
  this.schemeService.getSchemeById(id).subscribe(
    (scheme: Scheme) => {
      this.scheme = scheme;

      // Convert startDate and endDate to 'YYYY-MM-DDTHH:mm:ss' format if needed
      if (scheme.startDate) {
        this.scheme.startDate = this.convertToDateTimeString(scheme.startDate);
      }
      if (scheme.endDate) {
        this.scheme.endDate = this.convertToDateTimeString(scheme.endDate);
      }
    },
    (error) => {
      console.error('Error fetching scheme:', error);
    }
  );
}

// Convert to 'YYYY-MM-DDTHH:mm:ss' format
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


  // Upload Image for scheme
  async uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.click(); // Trigger the file picker

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        try {
          this.isUploading = true;
          const filePath = `scheme_images/${new Date().getTime()}_${file.name}`;
          const fileRef = this.storage.ref(filePath);
          const task = this.storage.upload(filePath, file);

          await task;
          const downloadURL = await fileRef.getDownloadURL().toPromise();
          this.scheme.imagePath = downloadURL; // Store the image URL in the scheme object
          this.isUploading = false;
        } catch (error) {
          console.error('Error uploading image:', error);
          this.isUploading = false;
        }
      }
    };
  }

  // Save the scheme (update if schemeId exists)
  async saveScheme() {
    try {
      if (this.schemeId) {
        await this.schemeService.updateScheme(this.scheme); // Update existing scheme
      } else {
        await this.schemeService.add(this.scheme); // Add new scheme if no ID
      }

      this.router.navigate(['/tabs/admin']); // Navigate back after saving
    } catch (error) {
      console.error('Error saving scheme:', error);
    }
  }

  // Navigate back
  goBack() {
    this.navController.back();
  }
}
