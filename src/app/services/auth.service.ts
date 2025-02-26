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

  // Register with email/password - updated to include more user data
  async register(userData: any) {
  try {
    console.log('Starting registration process for:', userData.email);
    
    // First create the user authentication
    const credential = await this.afAuth.createUserWithEmailAndPassword(userData.email, userData.password);
    console.log('Firebase authentication successful:', credential);
    
    if (credential.user) {
      const userId = credential.user.uid;
      console.log('Storing user data in Firestore for user:', userId);
      
      // Prepare user document data
      const userDoc = {
        uid: userId,
        email: userData.email,
        name: userData.name,
        dob: userData.dob || null,
        phone: userData.phone || null,
        emergencyContact: userData.emergencyContact || null,
        emergencyPhone: userData.emergencyPhone || null,
        role: 'unassigned',
        profileCompleted: false,
        createdAt: new Date() // Use regular Date instead of Firebase timestamp
      };
      
      // Use simpler approach to create document
      try {
        // Try using Web Modular API (this avoids some Angular injection issues)
        const firebase = await import('firebase/app');
        const firestore = await import('firebase/firestore');
        const { getFirestore, doc, setDoc } = firestore;
        
        const db = getFirestore();
        await setDoc(doc(db, 'users', userId), userDoc);
        console.log('User document created successfully using modular API');
      } catch (firestoreError) {
        console.error('Error creating user document with modular API:', firestoreError);
        
        // Fallback to traditional approach
        try {
          await this.firestore.collection('users').doc(userId).set(userDoc);
          console.log('User document created with traditional API');
        } catch (fallbackError) {
          console.error('All document creation attempts failed:', fallbackError);
        }
      }
      
      return credential;
    } else {
      console.error('User creation succeeded but no user object returned');
      await this.afAuth.signOut();
      throw new Error('User creation failed: No user object returned');
    }
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
}

  // Update user profile
  async updateUserProfile(userId: string, profileData: any) {
    try {
      await this.firestore.collection('users').doc(userId).update({
        ...profileData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
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

  // In auth.service.ts
  // Add this method to initialize the users collection
  async initializeFirestoreCollections() {
    try {
      // Check if 'users' collection exists by trying to get its metadata
      const usersRef = this.firestore.collection('users');
      const snapshot = await usersRef.get().toPromise();
      
      // If collection doesn't exist or is empty, create a placeholder document
      if (!snapshot || snapshot.empty) {
        console.log('Initializing users collection with placeholder');
        await this.firestore.collection('users').doc('placeholder').set({
          info: 'This is a placeholder document. It can be safely deleted.',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing Firestore collections:', error);
      return false;
    }
  }
}