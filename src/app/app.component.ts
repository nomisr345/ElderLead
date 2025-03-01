import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuController, Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';
import { initializeApp } from 'firebase/app';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  private authSub: Subscription | null = null;
  
  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private platform: Platform,
    private authService: AuthService
  ) {
    this.initializeApp();
  }

  ngOnInit() {
    // Initialize Firebase modular SDK
    initializeApp(environment.firebase);
    
    // Subscribe to auth state to handle redirects
    this.authSub = this.authService.isAuthenticated().subscribe(user => {
      console.log('Auth state changed:', user ? 'logged in' : 'logged out');
    });
  }

  async initializeApp() {
    this.platform.ready().then(async () => {
      console.log('Platform ready');
      
      try {
        // Initialize collections
        await this.authService.initializeFirestoreCollections();
        console.log('Firestore collections initialized');
      } catch (error) {
        console.error('Error initializing Firestore collections:', error);
      }
    });
  }

  async openMore() {
    await this.menuCtrl.open('start');
  }

  async closeMenu() {
    await this.menuCtrl.close('start');
  }

  navigateToPage(page: string) {
  console.log('Navigating to', page);
  
  // Add your navigation logic here
  switch(page) {
    case 'profile':
      this.router.navigate(['/profile-setup']);  // Changed to profile-setup route
      break;
    case 'ai-companion':
      this.router.navigate(['/chatbot']);  // Changed to chatbot route
      break;
    case 'account':
      this.router.navigate(['/settings/account']);
      break;
    case 'privacy':
      this.router.navigate(['/settings/privacy']);
      break;
    case 'help':
      this.router.navigate(['/help']);
      break;
    case 'report':
      this.router.navigate(['/report-problem']);
      break;
    case 'terms':
      this.router.navigate(['/terms']);
      break;
    default:
      this.router.navigate(['/tabs/dashboard']);
  }
  
  this.closeMenu();
}

  setTheme(theme: string) {
    console.log('Setting theme to', theme);
    document.body.classList.remove('light-theme', 'dark-theme', 'custom-theme');
    document.body.classList.add(`${theme}-theme`);
    this.closeMenu();
  }

  lockApp() {
    console.log('Locking app');
    this.router.navigate(['/lock-screen']);
    this.closeMenu();
  }

  async logout() {
    console.log('Logging out');
    try {
      await this.authService.signOut();
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
    this.closeMenu();
  }
  
  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }
}