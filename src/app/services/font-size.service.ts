import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FontSizeService {
  private fontSizeSubject = new BehaviorSubject<number>(parseInt(localStorage.getItem('fontSize') || '16', 10));
  fontSize$ = this.fontSizeSubject.asObservable();

  constructor() {
    this.applyFontSize(this.fontSizeSubject.value);
  }

  setFontSize(size: number) {
    this.fontSizeSubject.next(size);
    localStorage.setItem('fontSize', size.toString());
    this.applyFontSize(size);
  }

  increaseFontSize() {
    let newSize = this.fontSizeSubject.value + 1;
    if (newSize <= 30) this.setFontSize(newSize);
  }

  decreaseFontSize() {
    let newSize = this.fontSizeSubject.value - 1;
    if (newSize >= 12) this.setFontSize(newSize);
  }

  private applyFontSize(size: number) {
    document.documentElement.style.setProperty('--app-font-size', `${size}px`);
  }
}
