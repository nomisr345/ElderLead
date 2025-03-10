import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NewsService {

  private apiKey = '31ef9568336e406bab5e680514bb8df6'; // Replace with your actual API key
  private apiUrl = 'https://newsapi.org/v2/everything';

  constructor(private http: HttpClient) {}

  getElderlyNews(): Observable<any> {
    const url = `${this.apiUrl}?q=elderly OR "senior care" OR "nursing home" OR aging&language=en&domains=channelnewsasia.com,straitstimes.com,todayonline.com&sortBy=publishedAt&apiKey=${this.apiKey}`;
    return this.http.get<any>(url);
  }
}
