import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CommunityService } from '../services/community.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-community-setup',
  templateUrl: './community-setup.page.html',
  styleUrls: ['./community-setup.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class CommunitySetupPage implements OnInit {
  communityForm!: FormGroup;
  imageFile: File | null = null;
  imagePreview: string | null = null;
  isSubmitting = false;
  currentStep = 1;
  totalSteps = 3;
  
  // Image validation limits
  private maxImageSize = 2 * 1024 * 1024; // 2MB in bytes
  private validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  constructor(
    private formBuilder: FormBuilder,
    private communityService: CommunityService,
    private storageService: StorageService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.createForm();
  }

  createForm() {
    this.communityForm = this.formBuilder.group({
      communityName: ['', [Validators.required, Validators.maxLength(50)]],
      short_description: ['', [Validators.required, Validators.maxLength(100)]],
      long_description: ['', [Validators.required, Validators.maxLength(500)]],
      isPublic: [true]
    });
  }

  async onSubmit() {
    if (this.communityForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.communityForm.controls).forEach(key => {
        const control = this.communityForm.get(key);
        control?.markAsTouched();
      });
      
      // Show error toast
      const toast = await this.toastController.create({
        message: 'Please fill in all required fields correctly',
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      
      await toast.present();
      return;
    }

    this.isSubmitting = true;
    const loading = await this.loadingController.create({
      message: 'Creating your community...',
      spinner: 'circles'
    });
    await loading.present();

    try {
      const communityData = this.communityForm.value;
      
      // Ensure both name and communityName are set for compatibility
      communityData.name = communityData.communityName;
      
      // Create the community with optional image
      const communityId = await this.communityService.createCommunity(
        communityData, 
        this.imageFile || undefined
      );
      
      await loading.dismiss();
      this.isSubmitting = false;
      
      // Show success message
      const toast = await this.toastController.create({
        message: 'Community created successfully!',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
      
      // Navigate to the new community details page
      this.router.navigate(['/community-details', communityId]);
    } catch (error) {
      console.error('Error creating community:', error);
      await loading.dismiss();
      this.isSubmitting = false;
      
      // Show error message with specific details if available
      let errorMessage = 'Failed to create community. Please try again.';
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      const toast = await this.toastController.create({
        message: errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  async onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!this.validImageTypes.includes(file.type)) {
      const toast = await this.toastController.create({
        message: 'Please select a valid image (JPEG, PNG, GIF, WEBP)',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }
    
    // Validate file size
    if (file.size > this.maxImageSize) {
      const toast = await this.toastController.create({
        message: 'Image size should be less than 2MB',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }
    
    this.imageFile = file;
    
    // Create preview from the original file (for display only)
    try {
      // For preview, we'll use a compressed version to improve performance
      const compressedFile = await this.storageService.compressImage(file, 400, 400, 0.7);
      this.imagePreview = await this.storageService.createLocalImageUrl(compressedFile);
    } catch (error) {
      console.error('Error creating image preview:', error);
      this.imagePreview = null;
      
      const toast = await this.toastController.create({
        message: 'Failed to create image preview. Please try another image.',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
    }
  }

  async removeImage() {
    // Ask for confirmation before removing the image
    const alert = await this.alertController.create({
      header: 'Remove Image',
      message: 'Are you sure you want to remove this image?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          handler: () => {
            this.imageFile = null;
            this.imagePreview = null;
          }
        }
      ]
    });
    
    await alert.present();
  }

  // Helper method for form validation error messages
  hasError(controlName: string, errorName: string): boolean {
    const control = this.communityForm.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }
  
  // Stepper methods
  nextStep() {
    const currentControls = this.getControlsForStep(this.currentStep);
    
    // Validate current step before proceeding
    let isStepValid = true;
    currentControls.forEach(controlName => {
      const control = this.communityForm.get(controlName);
      control?.markAsTouched();
      if (control?.invalid) {
        isStepValid = false;
      }
    });
    
    if (!isStepValid) {
      this.showStepValidationError();
      return;
    }
    
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }
  
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  goToStep(step: number) {
    // Only allow going to completed steps or the next step
    if (step <= this.currentStep || step === this.currentStep + 1) {
      
      // Validate current step before allowing to skip ahead
      if (step > this.currentStep) {
        const currentControls = this.getControlsForStep(this.currentStep);
        let isStepValid = true;
        
        currentControls.forEach(controlName => {
          const control = this.communityForm.get(controlName);
          control?.markAsTouched();
          if (control?.invalid) {
            isStepValid = false;
          }
        });
        
        if (!isStepValid) {
          this.showStepValidationError();
          return;
        }
      }
      
      this.currentStep = step;
    }
  }
  
  async showStepValidationError() {
    const toast = await this.toastController.create({
      message: 'Please complete all required fields before continuing',
      duration: 2000,
      color: 'warning',
      position: 'top'
    });
    
    await toast.present();
  }
  
  // Get control names that belong to the current step
  getControlsForStep(step: number): string[] {
    switch (step) {
      case 1:
        return ['communityName'];
      case 2:
        return ['short_description', 'long_description'];
      case 3:
        return ['isPublic'];
      default:
        return [];
    }
  }

  // Cancel and go back
  async cancel() {
    // If form has been modified, show confirmation
    if (this.communityForm.dirty || this.imageFile) {
      const alert = await this.alertController.create({
        header: 'Discard Changes',
        message: 'Are you sure you want to cancel? Any changes you made will be lost.',
        buttons: [
          {
            text: 'Stay',
            role: 'cancel'
          },
          {
            text: 'Discard',
            handler: () => {
              this.router.navigate(['/community']);
            }
          }
        ]
      });
      
      await alert.present();
    } else {
      // If no changes, go back directly
      this.router.navigate(['/community']);
    }
  }
}