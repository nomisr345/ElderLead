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
  imports: [CommonModule, IonicModule],
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
    console.log('Dashboard component initialized');

    // Subscribe to auth state for logout detection
    this.authSubscription = this.authService.getAuthState().subscribe(async (user) => {
      console.log('Auth state in dashboard:', user ? `User: ${user.uid}` : 'No user');

      if (user) {
        try {
          // Get user document from Firestore using modular API
          const db = getFirestore(firebaseApp.getApp());
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            // Get user data from document
            this.user = docSnap.data();
            console.log('User data from Firestore:', this.user);

            // Extract user name
            if (this.user) {
              this.userName = this.getFirstName(this.user.displayName || this.user.name || 'User');
              console.log('Set user name to:', this.userName);

              // Check if profile needs completion
              if (this.user.profileCompleted === false) {
                this.showProfileCompletionAlert();
              }
            }
          } else {
            console.log('No user document found');
            this.userName = 'User';
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
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
          role: 'cancel',
        },
        {
          text: 'Complete Now',
          handler: () => {
            this.router.navigateByUrl('/profile-setup', { replaceUrl: false });
          },
        },
      ],
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


  /*async refresh(event: any) {
    console.log("Begin refresh operation");
    

    try {
      // Get current user
      const user = await this.authService.getCurrentUser();
      

      if (user) {
        // Get user document from Firestore using modular API
        const db = getFirestore(firebaseApp.getApp());
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        

        if (docSnap.exists()) {
          // Update user data
          this.user = docSnap.data();
          this.userName = this.getFirstName(this.user.displayName || this.user.name || 'User');
          

          // Check profile completion
          if (this.user.profileCompleted === false) {
            this.showProfileCompletionAlert();
          }
        }
      }
      

      // Complete the refresh
      event.target.complete();
      console.log("Refresh completed successfully");
      

    } catch (error) {
      console.error("Error during refresh:", error);
      event.target.complete();
    }
  }*/
 
  async refresh(event: any) {
    // Reload user data or perform refresh operations
    try {
      // Simulating a refresh - you might want to add actual refresh logic
      await new Promise((resolve) => setTimeout(resolve, 1000));
      event.target.complete(); // Complete the refresher
    } catch (error) {
      console.error('Refresh error:', error);
      event.target.complete(); // Always complete the refresher
    }
  }

  goToResources() {
    console.log('Navigating to resources page');
    this.router.navigate(['/resource-hub']); // Adjust route as needed
  }
}