import { Component } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private menuCtrl: MenuController,
    private router: Router
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
    // For example:
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

  logout() {
    console.log('Logging out');
    // Implement logout logic - clear tokens, etc.
    // For example:
    // this.authService.logout();
    this.router.navigate(['/login']);
    this.closeMenu();
  }
}