import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async login() {
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.value;
    const loading = await this.loadingController.create({
      message: 'Signing in...',
      spinner: 'crescent'
    });
    
    await loading.present();

    try {
      await this.authService.loginWithEmail(email, password);
      this.router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
    } catch (error: any) {
      console.error('Login error:', error);
      const alert = await this.alertController.create({
        header: 'Login Failed',
        message: error?.message || 'Please check your credentials and try again.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      loading.dismiss();
    }
  }

  async loginWithGoogle() {
    const loading = await this.loadingController.create({
      message: 'Signing in with Google...',
      spinner: 'crescent'
    });
    
    await loading.present();

    try {
      await this.authService.loginWithGoogle();
      this.router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
    } catch (error: any) {
      console.error('Google login error:', error);
      const alert = await this.alertController.create({
        header: 'Login Failed',
        message: error?.message || 'Failed to sign in with Google. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      loading.dismiss();
    }
  }

  goToRegister() {
    this.router.navigateByUrl('/register');
  }
}