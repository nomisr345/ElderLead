import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CommunityService } from '../services/community.service';
import { map, switchMap, take, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CommunityMemberGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private communityService: CommunityService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Extract community ID from route params
    const communityId = route.paramMap.get('communityId');
    if (!communityId) {
      console.error('No community ID found in route');
      this.router.navigate(['/community']);
      return from(Promise.resolve(false));
    }

    // Check if user is authenticated and a member of the community
    return this.authService.getAuthState().pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          console.log('Access denied - User not authenticated');
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return from(Promise.resolve(false));
        }
        
        // Check if user is a member of the community
        return from(this.communityService.isMember(communityId, user.uid));
      }),
      tap(isMember => {
        if (!isMember) {
          console.log('Access denied - User is not a member of this community');
          this.router.navigate(['/community-details', communityId]);
        }
      })
    );
  }
}