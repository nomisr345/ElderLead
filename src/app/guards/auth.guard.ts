import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { map, take, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.getAuthState().pipe(
      take(1),
      map(user => !!user), // Map to boolean
      tap(isAuthenticated => {
        if (!isAuthenticated) {
          console.log('Access denied - User not authenticated');
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        }
      })
    );
  }
}