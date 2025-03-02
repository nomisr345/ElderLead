import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { redirectUnauthorizedTo, redirectLoggedInTo, canActivate } from '@angular/fire/compat/auth-guard';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const redirectLoggedInToDashboard = () => redirectLoggedInTo(['tabs/dashboard']);

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
    // Temporarily removed to fix login access
    // ...canActivate(redirectLoggedInToDashboard)
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.module').then(m => m.RegisterPageModule)
    // Temporarily removed to fix registration access
    // ...canActivate(redirectLoggedInToDashboard)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'profile-setup',
    loadChildren: () => import('./profile-setup/profile-setup.module').then(m => m.ProfileSetupPageModule),
    ...canActivate(redirectUnauthorizedToLogin) // Add auth guard to protect this route
  },
  {
    path: 'chatbot',
    loadChildren: () => import('./chatbot/chatbot.module').then(m => m.ChatbotPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'all-activities',
    loadChildren: () => import('./all-activities/all-activities.module').then( m => m.AllActivitiesPageModule)
  },
  {
    path: 'event-details',
    loadChildren: () => import('./event-details/event-details.module').then( m => m.EventDetailsPageModule)
  },
  {
    path: 'activity-confirmation',
    loadChildren: () => import('./activity-confirmation/activity-confirmation.module').then( m => m.ActivityConfirmationPageModule)
  },
  {
    path: 'my-activities',
    loadChildren: () => import('./my-activities/my-activities.module').then( m => m.MyActivitiesPageModule)
  },
  {
    path: 'maps',
    loadChildren: () => import('./maps/maps.module').then( m => m.MapsPageModule)
  },
  {
    path: '**',
    redirectTo: 'login'
  },
  

  

 

  

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }