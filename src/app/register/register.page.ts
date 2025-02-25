import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
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
  userType: string = 'elderly'; // Default user type

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
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  setUserType(type: string) {
    this.userType = type;
  }

  async register() {
    if (this.registerForm.invalid) {
      return;
    }

    const { name, email, password } = this.registerForm.value;
    const loading = await this.loadingController.create({
      message: 'Creating account...',
      spinner: 'crescent'
    });
    
    await loading.present();

    try {
      await this.authService.register(email, password, name, this.userType);
      
      const alert = await this.alertController.create({
        header: 'Account Created',
        message: 'Your account has been created successfully!',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              this.router.navigateByUrl('/login', { replaceUrl: true });
            }
          }
        ]
      });
      
      await alert.present();
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Check for specific error types
      if (error.message === 'email-already-exists' || error.code === 'auth/email-already-in-use') {
        const alert = await this.alertController.create({
          header: 'Account Already Exists',
          message: 'You have already registered with this email address. Please sign in instead.',
          buttons: [
            {
              text: 'Go to Login',
              handler: () => {
                this.router.navigateByUrl('/login', { replaceUrl: true });
              }
            }
          ]
        });
        await alert.present();
      } else {
        const alert = await this.alertController.create({
          header: 'Registration Failed',
          message: error?.message || 'An unexpected error occurred. Please try again.',
          buttons: ['OK']
        });
        await alert.present();
      }
    } finally {
      loading.dismiss();
    }
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}