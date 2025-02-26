import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;
  userType: string = 'elderly'; // Default to elderly
  maxDate: string = new Date().toISOString();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      dob: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{8,12}$')]],
      emergencyContact: [''],
      emergencyPhone: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  // Add method to set user type
  setUserType(type: string) {
    this.userType = type;
  }

  async register() {
    if (this.registerForm.invalid) {
      // Show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      return;
    }

    const userData = {
      ...this.registerForm.value,
      userType: this.userType
    };
    
    const loading = await this.loadingController.create({
      message: 'Creating your account...',
      spinner: 'crescent'
    });
    
    await loading.present();

    try {
      // Register the user with all form data
      const result = await this.authService.register(userData);
      
      loading.dismiss();
      
      // As long as we have a user credential, consider it a success
      if (result && result.user) {
        const alert = await this.alertController.create({
          header: 'Registration Successful',
          message: 'Your account has been created successfully.',
          buttons: [
            {
              text: 'OK',
              handler: () => {
                // After registration success, sign out and redirect to login
                this.authService.signOut().then(() => {
                  this.router.navigateByUrl('/login', { replaceUrl: true });
                });
              }
            }
          ]
        });
        
        await alert.present();
      } else {
        throw new Error('User registration did not return a valid user object');
      }
    } catch (error: any) {
      loading.dismiss();
      
      let errorMessage = 'Could not create your account. Please try again.';
      console.error('Registration error:', error);
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'This password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address is not valid.';
      }
      
      const alert = await this.alertController.create({
        header: 'Registration Failed',
        message: errorMessage,
        buttons: ['OK']
      });
      
      await alert.present();
    }
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}