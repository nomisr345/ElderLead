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
  userType: string = 'user'; // Default user type

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
    
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  // Add this missing method
  setUserType(type: string) {
    this.userType = type;
  }

  async register() {
    if (this.registerForm.invalid) {
      return;
    }

    const { name, email, password } = this.registerForm.value;
    
    const loading = await this.loadingController.create({
      message: 'Creating your account...',
      spinner: 'crescent'
    });
    
    await loading.present();

    try {
      await this.authService.register(email, password, name, this.userType); 
      loading.dismiss();
      
      const alert = await this.alertController.create({
        header: 'Registration Successful',
        message: 'Your account has been created successfully.',
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
      loading.dismiss();
      
      const alert = await this.alertController.create({
        header: 'Registration Failed',
        message: error?.message || 'Could not create your account. Please try again.',
        buttons: ['OK']
      });
      
      await alert.present();
    }
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}