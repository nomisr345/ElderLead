import { Component } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private authService: AuthService
  ) {}

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
        this.router.navigate(['/profile']);
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
        this.router.navigate(['/dashboard']);
    }
    this.closeMenu();
  }

  setTheme(theme: string) {
    console.log('Setting theme to', theme);
    // Implement theme switching logic here
    document.body.classList.remove('light-theme', 'dark-theme', 'custom-theme');
    document.body.classList.add(`${theme}-theme`);
    this.closeMenu();
  }

  lockApp() {
    console.log('Locking app');
    // Implement app locking logic
    this.router.navigate(['/lock-screen']);
    this.closeMenu();
  }

  async logout() {
    console.log('Logging out');
    try {
      // Use signOut to match the dashboard page
      await this.authService.signOut();
      // Navigate to login with replaceUrl to clear navigation history
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.closeMenu();
    }
  }
}