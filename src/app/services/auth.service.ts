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
  user$: Observable<any>;
  
  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {
    // Initialize the user$ Observable with proper injection context
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

  // Register with email/password
  async register(email: string, password: string, name: string, userType: string) {
    try {
      console.log('Starting registration process for:', email);
      
      // First create the user
      const credential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      console.log('Firebase authentication successful:', credential);
      
      if (credential.user) {
        console.log('Storing user data in Firestore for user:', credential.user.uid);
        
        try {
          // Store additional user info in Firestore - SEPARATED TRY/CATCH BLOCK
          await this.firestore.collection('users').doc(credential.user.uid).set({
            uid: credential.user.uid,
            email: email,
            name: name,
            userType: userType,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          console.log('User data stored successfully in Firestore');
          return credential;
        } catch (firestoreError) {
          console.error('Error storing user data in Firestore:', firestoreError);
          
          // The user was created in Authentication but Firestore failed
          // Consider whether to delete the auth user or not
          // For now, let's continue with the registration as the auth part succeeded
          
          // We could delete the auth user like this if desired:
          // await credential.user.delete();
          
          return credential; // Return success anyway if you want to allow login
          
          // Or throw an error if you want to consider this a failed registration:
          // throw new Error('Failed to store user data. Please try again.');
        }
      } else {
        console.error('User creation succeeded but no user object returned');
        await this.afAuth.signOut();
        throw new Error('User creation failed: No user object returned');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      
      // If there was an error during registration, make sure to sign out
      try {
        console.log('Attempting to sign out after registration error');
        await this.afAuth.signOut();
        console.log('Sign out successful after registration error');
      } catch (signOutError) {
        console.error('Error signing out after failed registration:', signOutError);
      }
      
      throw error; // re-throw the original error for handling in the component
    }
  }

  // Sign out
  async signOut() {
    try {
      await this.afAuth.signOut();
    } catch (error) {
      throw error;
    }
  }

  // Alias for signOut for compatibility
  async logout() {
    return this.signOut();
  }
}