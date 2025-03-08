import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, IonicModule, LoadingController, ActionSheetController, RefresherEventDetail } from '@ionic/angular';
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
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  profileForm!: FormGroup;
  role: string = '';
  user: any;
  userId: string | null = null;
  step: number = 1; // 1 = role selection, 2 = role-specific fields
  private authSubscription: Subscription | null = null;
  
  // Profile image
  profileImage: string | null = null;
  selectedFile: File | null = null;
  isUploading: boolean = false;

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
    private alertController: AlertController,
    private actionSheetController: ActionSheetController
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
            
            // Set profile image if available
            if (this.user['photoURL']) {
              this.profileImage = this.user['photoURL'];
            }
            
            // If user already has a role, pre-select it and go directly to step 2
            if (this.user['role']) {
              this.role = this.user['role'];
              console.log('Preselected role:', this.role);
              
              // Move directly to appropriate form
              this.step = 2;
              
              // Create form based on selected role and pre-fill with existing data
              if (this.role === 'elderly') {
                this.profileForm = this.formBuilder.group(this.elderlyFields);
                
                // Pre-fill form with existing data if available
                if (this.user) {
                  this.profileForm.patchValue({
                    mobilityStatus: this.user['mobilityStatus'] || '',
                    activityPreferences: this.user['activityPreferences'] || '',
                    healthConsiderations: this.user['healthConsiderations'] || '',
                    preferredCommunication: this.user['preferredCommunication'] || '',
                    location: this.user['location'] || ''
                  });
                }
              } else if (this.role === 'caregiver') {
                this.profileForm = this.formBuilder.group(this.caregiverFields);
                
                // Pre-fill form with existing data if available
                if (this.user) {
                  this.profileForm.patchValue({
                    relationship: this.user['relationship'] || '',
                    experience: this.user['experience'] || '',
                    expertise: this.user['expertise'] || '',
                    availability: this.user['availability'] || '',
                    certifications: this.user['certifications'] || '',
                    serviceRadius: this.user['serviceRadius'] || ''
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
      // Upload profile image if selected
      let photoURL = this.user && this.user['photoURL'] ? this.user['photoURL'] : null;
      
      if (this.selectedFile) {
        try {
          photoURL = await this.uploadProfileImage(this.selectedFile);
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          // Continue with saving profile even if image upload fails
        }
      }
      
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
        photoURL: photoURL, // Add the profile image URL
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      console.log('Saving profile data:', profileData);
      
      // Update user document in Firestore directly
      const db = getFirestore(firebaseApp.getApp());
      const userDocRef = doc(db, 'users', this.userId);
      await setDoc(userDocRef, profileData, { merge: true });
      
      // Also update the Firebase Auth user profile with the photo URL
      try {
        const currentUser = await this.authService.getCurrentUser();
        if (currentUser && photoURL) {
          await currentUser.updateProfile({
            photoURL: photoURL
          });
        }
      } catch (authUpdateError) {
        console.error('Error updating auth profile:', authUpdateError);
        // Continue with saving profile even if auth profile update fails
      }
      
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
    // Always redirect to dashboard when back button is clicked
    this.router.navigateByUrl('/tabs/dashboard');
  }

  // Pull to refresh implementation
  refresh(event: CustomEvent<RefresherEventDetail>) {
    setTimeout(async () => {
      if (this.userId) {
        try {
          // Get user document from Firestore using modular API
          const db = getFirestore(firebaseApp.getApp());
          const userDocRef = doc(db, 'users', this.userId);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            this.user = docSnap.data();
            
            // Set profile image if available
            if (this.user['photoURL']) {
              this.profileImage = this.user['photoURL'];
            }
            
            // Reset form with fresh data
            if (this.role === 'elderly') {
              this.profileForm.patchValue({
                mobilityStatus: this.user['mobilityStatus'] || '',
                activityPreferences: this.user['activityPreferences'] || '',
                healthConsiderations: this.user['healthConsiderations'] || '',
                preferredCommunication: this.user['preferredCommunication'] || '',
                location: this.user['location'] || ''
              });
            } else if (this.role === 'caregiver') {
              this.profileForm.patchValue({
                relationship: this.user['relationship'] || '',
                experience: this.user['experience'] || '',
                expertise: this.user['expertise'] || '',
                availability: this.user['availability'] || '',
                certifications: this.user['certifications'] || '',
                serviceRadius: this.user['serviceRadius'] || ''
              });
            }
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }
      event.detail.complete();
    }, 1000);
  }

  // Profile image methods
  openFileBrowser() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  async selectImageSource() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Image Source',
      buttons: [
        {
          text: 'Camera',
          icon: 'camera',
          handler: () => {
            this.takePhoto();
          }
        },
        {
          text: 'Photo Gallery',
          icon: 'image',
          handler: () => {
            this.openFileBrowser();
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async takePhoto() {
    // Try to dynamically import the Camera plugin
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          width: 500,
          height: 500
        });
        
        // Convert the dataUrl to a File object
        if (image.dataUrl) {
          this.profileImage = image.dataUrl;
          const response = await fetch(image.dataUrl);
          const blob = await response.blob();
          this.selectedFile = new File(
            [blob], 
            `profile_${Date.now()}.${image.format}`, 
            { type: `image/${image.format}` }
          );
        }
      } catch (error: unknown) {
        // Type guard to check if error is an object with a message property
        if (error instanceof Error) {
          console.error('Error taking photo:', error);
          
          // Check for camera cancellation
          if (error.message?.includes('cancelled')) {
            console.log('User cancelled photo capture');
          } else {
            this.showAlert('Camera Error', 'Could not access camera. Please try gallery or try again later.');
          }
        } else {
          // Handle case where error is not an Error object
          console.error('Unexpected error taking photo:', error);
          this.showAlert('Camera Error', 'An unexpected error occurred while accessing the camera.');
        }
      }
    } catch (importError: unknown) {
      // Type guard for import error
      if (importError instanceof Error) {
        console.error('Error loading Camera module:', importError);
        this.showAlert('Feature Unavailable', 'Camera is not available. Please use the photo gallery option.');
      } else {
        console.error('Unexpected error loading Camera module:', importError);
        this.showAlert('Error', 'An unexpected error occurred.');
      }
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImage = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  async uploadProfileImage(file: File): Promise<string> {
    if (!this.userId) {
      throw new Error('No user ID available');
    }

    this.isUploading = true;
    
    try {
      // Use the service method for upload
      const downloadUrl = await this.authService.uploadProfileImage(this.userId, file);
      
      this.isUploading = false;
      return downloadUrl;
    } catch (error) {
      this.isUploading = false;
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}