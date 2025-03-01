import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule]
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isSubmitted = false;
  
  constructor(
    public formBuilder: FormBuilder,
    private authService: AuthService, 
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get errorControl() {
    return this.loginForm.controls;
  }

  async login() {
    this.isSubmitted = true;
    
    if (!this.loginForm.valid) {
      console.log('Please provide all required fields');
      return;
    }
    
    const loading = await this.loadingController.create({
      message: 'Logging in...',
    });
    await loading.present();

    try {
      const email = this.loginForm.value.email;
      const password = this.loginForm.value.password;
      
      const result = await this.authService.loginWithEmail(email, password);
      await loading.dismiss();
      
      if (result && result.user) {
        console.log('Login successful, navigating to dashboard');
        this.router.navigate(['/tabs/dashboard']);
      }
    } catch (error: any) {
      await loading.dismiss();
      console.error('Login error:', error);
      
      let errorMessage = 'Failed to login. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = 'Invalid email or password';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled';
            break;
          default:
            errorMessage = error.message || 'An unknown error occurred';
        }
      }
      
      const alert = await this.alertController.create({
        header: 'Login Failed',
        message: errorMessage,
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async googleLogin() {
    const loading = await this.loadingController.create({
      message: 'Logging in with Google...',
    });
    await loading.present();

    try {
      const result = await this.authService.loginWithGoogle();
      await loading.dismiss();
      
      if (result && result.user) {
        console.log('Google login successful, navigating to dashboard');
        this.router.navigate(['/tabs/dashboard']);
      }
    } catch (error: any) {
      await loading.dismiss();
      console.error('Google login error:', error);
      
      let errorMessage = 'Failed to login with Google. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login canceled. You closed the popup window.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Login popup was blocked by your browser. Please allow popups for this site.';
      }
      
      const alert = await this.alertController.create({
        header: 'Google Login Failed',
        message: errorMessage,
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}