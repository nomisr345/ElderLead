import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
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
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to user changes
    this.userSubscription = this.authService.user$.subscribe((user: any) => {
      this.user = user;
      // You can add additional logic based on user state here
    });
  }

  ngOnDestroy() {
    // Clean up subscription when component is destroyed
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
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