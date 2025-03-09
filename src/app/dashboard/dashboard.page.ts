import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import * as firebaseApp from 'firebase/app';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class DashboardPage implements OnInit, OnDestroy {
  user: any;
  userName: string = 'User'; // Default value
  private authSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    console.log("Dashboard component initialized");
    
    // Subscribe to auth state for logout detection
    this.authSubscription = this.authService.getAuthState().subscribe(async (user) => {
      console.log("Auth state in dashboard:", user ? `User: ${user.uid}` : 'No user');
      
      if (user) {
        try {
          // Get user document from Firestore using modular API
          const db = getFirestore(firebaseApp.getApp());
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            // Get user data from document
            this.user = docSnap.data();
            console.log("User data from Firestore:", this.user);
            
            // Extract user name
            if (this.user) {
              this.userName = this.getFirstName(this.user.displayName || this.user.name || 'User');
              console.log("Set user name to:", this.userName);
              
              // Check if profile needs completion
              if (this.user.profileCompleted === false) {
                this.showProfileCompletionAlert();
              }
            }
          } else {
            console.log("No user document found");
            this.userName = 'User';
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          this.userName = 'User';
        }
      } else {
        // No user, reset to default
        this.userName = 'User';
      }
    });
  }

  // Helper function to extract first name from full name
  private getFirstName(fullName: string): string {
    if (!fullName || typeof fullName !== 'string') return 'User';
    
    // Split the name and return first part
    const nameParts = fullName.split(' ');
    return nameParts[0] || 'User';
  }

  ngOnDestroy() {
    // Clean up subscription when component is destroyed
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
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

  goToProfile() {
    console.log('Navigating to profile setup page');
    this.router.navigate(['/profile-setup']);
  }

  goToResources() {
    console.log('Navigating to resource hub page');
    this.router.navigate(['/resource-hub']);
  }
}