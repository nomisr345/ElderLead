import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, IonicModule, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import * as firebaseApp from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-profile-setup',
  templateUrl: './profile-setup.page.html',
  styleUrls: ['./profile-setup.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule]
})
export class ProfileSetupPage implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  role: string = '';
  user: any;
  userId: string | null = null;
  step: number = 1; // 1 = role selection, 2 = role-specific fields
  private authSubscription: Subscription | null = null;

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

  async ngOnInit() {
    console.log('Profile setup component initialized');
    
    // Get authenticated user directly from Firebase Auth
    this.authSubscription = this.authService.getAuthState().subscribe(async (authUser) => {
      console.log('Auth state in profile setup:', authUser ? `User: ${authUser.uid}` : 'No user');
      
      if (authUser) {
        this.userId = authUser.uid;
        
        try {
          // Get user document from Firestore using modular API
          const db = getFirestore(firebaseApp.getApp());
          const userDocRef = doc(db, 'users', authUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            this.user = docSnap.data();
            console.log('User data loaded:', this.user);
            
            // If user already has a role, pre-select it and go directly to step 2
            if (this.user.role) {
              this.role = this.user.role;
              console.log('Preselected role:', this.role);
              
              // Move directly to appropriate form
              this.step = 2;
              
              // Create form based on selected role and pre-fill with existing data
              if (this.role === 'elderly') {
                this.profileForm = this.formBuilder.group(this.elderlyFields);
                
                // Pre-fill form with existing data if available
                if (this.user) {
                  this.profileForm.patchValue({
                    mobilityStatus: this.user.mobilityStatus || '',
                    activityPreferences: this.user.activityPreferences || '',
                    healthConsiderations: this.user.healthConsiderations || '',
                    preferredCommunication: this.user.preferredCommunication || '',
                    location: this.user.location || ''
                  });
                }
              } else if (this.role === 'caregiver') {
                this.profileForm = this.formBuilder.group(this.caregiverFields);
                
                // Pre-fill form with existing data if available
                if (this.user) {
                  this.profileForm.patchValue({
                    relationship: this.user.relationship || '',
                    experience: this.user.experience || '',
                    expertise: this.user.expertise || '',
                    availability: this.user.availability || '',
                    certifications: this.user.certifications || '',
                    serviceRadius: this.user.serviceRadius || ''
                  });
                }
              }
            }
          } else {
            console.log('No user document found');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // No authenticated user, redirect to login
        console.log('No authenticated user, redirecting to login');
        this.router.navigateByUrl('/login', { replaceUrl: true });
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

    if (!this.userId) {
      console.error('No user ID available');
      await this.showAlert('Error', 'User not found. Please log in again.');
      return;
    }

    // Show loading indicator
    const loading = await this.loadingController.create({
      message: 'Saving your profile...',
      spinner: 'crescent'
    });
    
    await loading.present();

    try {
      // Create the data object based on role - convert any possible undefined values to null
      const formValues = this.profileForm.value;
      const formDataCleaned = Object.keys(formValues).reduce((acc, key) => {
        // Convert undefined values to null for Firestore
        acc[key] = formValues[key] === undefined ? null : formValues[key];
        return acc;
      }, {} as Record<string, any>);
      
      // Create the final profile data object with proper fields
      const profileData = {
        ...formDataCleaned,
        role: this.role,
        userType: this.role, // For backward compatibility
        profileCompleted: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      console.log('Saving profile data:', profileData);
      
      // Update user document in Firestore directly
      const db = getFirestore(firebaseApp.getApp());
      const userDocRef = doc(db, 'users', this.userId);
      await setDoc(userDocRef, profileData, { merge: true });
      
      console.log('Profile saved successfully');
      
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

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  goBack() {
    if (this.step === 2) {
      this.step = 1;
      this.role = '';
    } else {
      this.router.navigateByUrl('/tabs/dashboard');
    }
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}