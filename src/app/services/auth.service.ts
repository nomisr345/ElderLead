import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastLogin: firebase.firestore.FieldValue;
  userType?: string;
  createdAt?: firebase.firestore.FieldValue;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<any>;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {
    // Get the auth state, then fetch the Firestore user document or return null
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

  // Email & Password Login
  async loginWithEmail(email: string, password: string) {
    try {
      const credential = await this.afAuth.signInWithEmailAndPassword(email, password);
      return credential.user;
    } catch (error) {
      throw error;
    }
  }

  // Google Authentication
  async loginWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const credential = await this.afAuth.signInWithPopup(provider);
      
      // Always update user data regardless if new or existing
      if (credential.user) {
        const isNewUser = credential.additionalUserInfo?.isNewUser || false;
        await this.updateUserData(credential.user, isNewUser ? 'elderly' : '');
      }
      
      return credential.user;
    } catch (error) {
      throw error;
    }
  }

  // Register with Email & Password
  async register(email: string, password: string, displayName: string, userType: string) {
    try {
      // Check if email already exists
      try {
        const methods = await this.afAuth.fetchSignInMethodsForEmail(email);
        if (methods && methods.length > 0) {
          throw new Error('email-already-exists');
        }
      } catch (error: any) {
        if (error.message === 'email-already-exists') {
          throw error;
        }
        // If it's another error, continue with registration
      }
      
      const credential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      
      // Update profile with display name
      if (credential.user) {
        await credential.user.updateProfile({
          displayName: displayName
        });
        
        // Store additional user data in Firestore
        await this.updateUserData(credential.user, userType);
      }
      
      return credential.user;
    } catch (error: any) {
      // If Firebase returns this specific error, make it more user-friendly
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('email-already-exists');
      }
      throw error;
    }
  }

  // Update user data in Firestore
  private async updateUserData(user: firebase.User, userType: string) {
    if (!user) return;
    
    const userRef = this.firestore.doc(`users/${user.uid}`);
    const userData = await userRef.get().toPromise();
    
    let data: UserData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Only set userType if:
    // 1. It's provided AND
    // 2. Either the user is new OR the userType field doesn't exist yet
    if (userType && (!userData?.exists || !userData.get('userType'))) {
      data.userType = userType;
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    }
    
    return userRef.set(data, { merge: true });
  }

  // Sign out
  async signOut() {
    await this.afAuth.signOut();
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.afAuth.authState;
  }

  // Get current user
  getCurrentUser() {
    return this.afAuth.currentUser;
  }
}