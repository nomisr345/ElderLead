import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FontSizeService {
  private fontSizeSubject = new BehaviorSubject<number>(16); // Default font size
  fontSize$ = this.fontSizeSubject.asObservable();

  constructor() {
    // Load saved font size from localStorage (or use default)
    const savedSize = localStorage.getItem('fontSize');
    if (savedSize) {
      this.fontSizeSubject.next(Number(savedSize));
    }
  }

  setFontSize(size: number) {
    this.fontSizeSubject.next(size);
    localStorage.setItem('fontSize', size.toString()); // Save to localStorage
  }
}
