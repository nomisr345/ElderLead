import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule] // Add this line
})
export class TabsPage {
  isAdmin = false;
  constructor(private menuCtrl: MenuController, private authService: AuthService, private router: Router) {
    this.authService.observeAuthState(user => {
      if (user) {
        if (user.email == 'elderlead123@gmail.com') {
          this.isAdmin = true;
          this.router.navigate(['/tabs/admin']);  // Redirect to admin tab
        } else {
          this.isAdmin = false;
          this.router.navigate(['/tabs/dashboard']);  // Redirect to user tab
        }
      } else {
        // If user logs out, reset variables and redirect to login
        this.isAdmin = false;
        
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    });
  }

  openMenu() {
    this.menuCtrl.open();
  }
}