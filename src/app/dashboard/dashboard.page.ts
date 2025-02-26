import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class DashboardPage implements OnInit, OnDestroy {
  user: any;
  private userSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    // Subscribe to user changes
    this.userSubscription = this.authService.user$.subscribe((user: any) => {
      this.user = user;
      
      // Check if profile is completed
      if (user && user.profileCompleted === false) {
        this.showProfileCompletionAlert();
      }
    });
  }

  ngOnDestroy() {
    // Clean up subscription when component is destroyed
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  async showProfileCompletionAlert() {
    const alert = await this.alertController.create({
      header: 'Complete Your Profile',
      message: 'Please complete your profile to fully use all features of the app.',
      buttons: [
        {
          text: 'Later',
          role: 'cancel'
        },
        {
          text: 'Complete Now',
          handler: () => {
            this.router.navigateByUrl('/profile-setup', { replaceUrl: false });
          }
        }
      ]
    });

    await alert.present();
  }

  async logout() {
    try {
      await this.authService.signOut();
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}