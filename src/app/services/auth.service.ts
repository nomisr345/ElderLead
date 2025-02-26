import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Add the user$ observable that's missing
  user$: Observable<any>;
  
  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {
    // Initialize the user$ Observable
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.firestore.doc(`users/${user.uid}`).valueChanges();
        } else {
          return of(null);
        }
      })
    );
  }

  // Get current user
  getCurrentUser() {
    return this.afAuth.currentUser;
  }

  // Get authentication state
  getAuthState(): Observable<firebase.User | null> {
    return this.afAuth.authState;
  }

  // Check if user is authenticated
  isAuthenticated(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      map(user => user !== null)
    );
  }

  // Email/Password Login
  async loginWithEmail(email: string, password: string) {
    try {
      return await this.afAuth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      throw error;
    }
  }

  // Google Login
  async loginWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      return await this.afAuth.signInWithPopup(provider);
    } catch (error) {
      throw error;
    }
  }

  // Register with email/password - renamed from registerWithEmail to match what's used in register.page.ts
  async register(email: string, password: string, name: string, userType: string) {
    try {
      const credential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      if (credential.user) {
        // Store additional user info in Firestore
        await this.firestore.collection('users').doc(credential.user.uid).set({
          uid: credential.user.uid,
          email: email,
          name: name,
          userType: userType,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      return credential;
    } catch (error) {
      throw error;
    }
  }

  // Logout - add signOut method to match what's used in dashboard.page.ts
  async signOut() {
    try {
      await this.afAuth.signOut();
    } catch (error) {
      throw error;
    }
  }

  // Keep the logout method for compatibility with app.component.ts
  async logout() {
    return this.signOut();
  }
}