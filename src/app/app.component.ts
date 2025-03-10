import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuController, Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { FontSizeService } from './services/font-size.service';
import { Subscription } from 'rxjs';
import { initializeApp } from 'firebase/app';
import { environment } from '../environments/environment';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { ModalController } from '@ionic/angular';
import { FontSizePage } from './modals/font-size/font-size.page';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  private authSub: Subscription | null = null;
  userData: any = null;
  userPhotoURL: string | null = null;
  userName: string = '';
  userRole: string = '';
  
  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private platform: Platform,
    private authService: AuthService,
    private modalCtrl: ModalController
  
  ) {
    this.initializeApp();
  }

  ngOnInit() {
    // Initialize Firebase modular SDK
    initializeApp(environment.firebase);
    
    // Subscribe to auth state to handle redirects and user data
    this.authSub = this.authService.isAuthenticated().subscribe(isAuthenticated => {
      console.log('Auth state changed:', isAuthenticated ? 'logged in' : 'logged out');
      
      if (isAuthenticated) {
        this.loadUserData();
      } else {
        this.userData = null;
        this.userPhotoURL = null;
        this.userName = '';
        this.userRole = '';
      }
    });
  }

  async loadUserData() {
    try {
      const currentUser = await this.authService.getCurrentUser();
      if (currentUser) {
        // Get user document from Firestore
        const db = getFirestore();
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          this.userData = docSnap.data();
          
          // Set user photo URL (prefer Firestore data over Auth data)
          this.userPhotoURL = this.userData.photoURL || currentUser.photoURL;
          
          // Set user name and role
          this.userName = this.userData.displayName || this.userData.name || currentUser.displayName || 'User';
          this.userRole = this.userData.role || 'user';
          
          console.log('User data loaded for menu:', {
            name: this.userName,
            role: this.userRole,
            photo: this.userPhotoURL ? 'Available' : 'Not available'
          });
        }
      }
    } catch (error) {
      console.error('Error loading user data for menu:', error);
    }
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

  async openFontSizeModal() {
    const modal = await this.modalCtrl.create({
      component: FontSizePage,
    });
    await modal.present();
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