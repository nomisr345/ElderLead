import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, IonicModule, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile-setup',
  templateUrl: './profile-setup.page.html',
  styleUrls: ['./profile-setup.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule]
})
export class ProfileSetupPage implements OnInit {
  profileForm!: FormGroup;
  role: string = '';
  user: any;
  step: number = 1; // 1 = role selection, 2 = role-specific fields

  // Form fields for elderly
  elderlyFields = {
    mobilityStatus: ['', Validators.required],
    activityPreferences: ['', Validators.required],
    healthConsiderations: [''],
    preferredCommunication: ['', Validators.required],
    location: ['', Validators.required]
  };

  // Form fields for caregiver
  caregiverFields = {
    relationship: ['', Validators.required],
    experience: ['', Validators.required],
    expertise: ['', Validators.required],
    availability: ['', Validators.required],
    certifications: [''],
    serviceRadius: ['', Validators.required]
  };

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    // Get current user data
    this.authService.user$.subscribe(user => {
      if (user) {
        this.user = user;
      }
    });
  }

  selectRole(role: string) {
    this.role = role;
    this.step = 2;
    
    // Create form based on selected role
    if (role === 'elderly') {
      this.profileForm = this.formBuilder.group(this.elderlyFields);
    } else if (role === 'caregiver') {
      this.profileForm = this.formBuilder.group(this.caregiverFields);
    }
  }

  async saveProfile() {
    if (!this.profileForm || this.profileForm.invalid || !this.role) {
      // Show validation errors
      if (this.profileForm) {
        Object.keys(this.profileForm.controls).forEach(key => {
          const control = this.profileForm.get(key);
          if (control) {
            control.markAsTouched();
          }
        });
      }
      return;
    }

    // Show loading indicator
    const loading = await this.loadingController.create({
      message: 'Saving your profile...',
      spinner: 'crescent'
    });
    
    await loading.present();

    try {
      if (!this.user || !this.user.uid) {
        throw new Error('User not found');
      }

      // Create the data object based on role
      const profileData = {
        ...this.profileForm.value,
        role: this.role,
        profileCompleted: true
      };
      
      // Update user document in Firestore
      await this.authService.updateUserProfile(this.user.uid, profileData);
      
      loading.dismiss();
      
      // Show success message
      const alert = await this.alertController.create({
        header: 'Profile Completed',
        message: 'Your profile has been successfully completed!',
        buttons: [{
          text: 'OK',
          handler: () => {
            // Navigate to dashboard
            this.router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
          }
        }]
      });
      
      await alert.present();
    } catch (error) {
      loading.dismiss();
      console.error('Error saving profile:', error);
      
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'There was an error saving your profile. Please try again.',
        buttons: ['OK']
      });
      
      await alert.present();
    }
  }

  goBack() {
    if (this.step === 2) {
      this.step = 1;
      this.role = '';
    } else {
      this.router.navigateByUrl('/tabs/dashboard');
    }
  }
}