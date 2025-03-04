import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingController } from '@ionic/angular';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;
  private loading: HTMLIonLoadingElement | null = null;

  constructor(private loadingController: LoadingController) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only show loading for API calls that need it
    if (this.shouldShowLoading(request)) {
      this.activeRequests++;
      if (this.activeRequests === 1) {
        this.presentLoading();
      }
    }

    return next.handle(request).pipe(
      finalize(() => {
        if (this.shouldShowLoading(request)) {
          this.activeRequests--;
          if (this.activeRequests === 0) {
            this.dismissLoading();
          }
        }
      })
    );
  }

  private shouldShowLoading(request: HttpRequest<any>): boolean {
    // Add conditions for when to show loading
    const url = request.url.toLowerCase();
    return url.includes('api.openai.com') && 
           !url.includes('chat/completions');
  }

  private async presentLoading() {
    try {
      this.loading = await this.loadingController.create({
        message: 'Please wait...',
        spinner: 'circles',
        cssClass: 'custom-loading'
      });
      await this.loading.present();
    } catch (error) {
      console.error('Error presenting loading:', error);
    }
  }

  private async dismissLoading() {
    if (this.loading) {
      try {
        await this.loading.dismiss();
        this.loading = null;
      } catch (error) {
        console.error('Error dismissing loading:', error);
      }
    }
  }
}