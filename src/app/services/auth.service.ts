import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastLogin: firebase.firestore.FieldValue;
  userType?: string;
  role?: string;
  createdAt?: firebase.firestore.FieldValue;
  [key: string]: any; // Allow any additional properties
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
      const credential = await this.afAuth.signInWithEmailAndPassword(email, password);
      // Update last login timestamp
      if (credential.user) {
        await this.firestore.doc(`users/${credential.user.uid}`).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(err => console.log('Could not update last login, but login successful'));
      }
      return credential;
    } catch (error) {
      console.error('Email login error:', error);
      throw error;
    }
  }

  // Google Login
  async loginWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const credential = await this.afAuth.signInWithPopup(provider);
      
      // Update or create user data in Firestore
      if (credential.user) {
        const userRef = this.firestore.doc(`users/${credential.user.uid}`);
        const userSnapshot = await userRef.get().toPromise();
        
        // Determine if this is a new user
        const isNewUser = credential.additionalUserInfo?.isNewUser || !userSnapshot?.exists;
        
        // Default to elderly/senior user type for new Google sign-ins
        const userData: UserData = {
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: credential.user.displayName,
          photoURL: credential.user.photoURL,
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Only set role/userType for new users
        if (isNewUser) {
          userData.role = 'elderly'; // Default role
          userData.userType = 'elderly'; // For compatibility
          userData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        await userRef.set(userData, { merge: true });
      }
      
      return credential;
    } catch (error) {
      console.error('Google login error:', error);
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
        
        // Prepare user document data - ensure role is properly set
        const userDoc = {
          uid: userId,
          email: userData.email,
          name: userData.name,
          displayName: userData.name, // For compatibility with Firebase Auth
          dob: userData.dob || null,
          phone: userData.phone || null,
          emergencyContact: userData.emergencyContact || null,
          emergencyPhone: userData.emergencyPhone || null,
          role: userData.userType || userData.role || 'elderly', // Ensure role is set from userType
          userType: userData.userType || userData.role || 'elderly', // For backward compatibility
          profileCompleted: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log('Saving user data with role:', userDoc.role);
        
        // Create user document
        try {
          await this.firestore.collection('users').doc(userId).set(userDoc);
          console.log('User document created successfully');
        } catch (firestoreError) {
          console.error('Error creating user document:', firestoreError);
          
          // Try alternate approach if first one fails
          try {
            // Try using Web Modular API
            const firebase = await import('firebase/app');
            const firestore = await import('firebase/firestore');
            const { getFirestore, doc, setDoc } = firestore;
            
            const db = getFirestore();
            await setDoc(doc(db, 'users', userId), userDoc);
            console.log('User document created successfully using modular API');
          } catch (fallbackError) {
            console.error('All document creation attempts failed:', fallbackError);
            // Don't throw error here, at least authentication was created
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
      // Include role explicitly in updates when applicable
      if (profileData.userType && !profileData.role) {
        profileData.role = profileData.userType;
      }
      
      await this.firestore.collection('users').doc(userId).update({
        ...profileData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('Profile updated successfully with data:', profileData);
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    try {
      // Clear any stored data first
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      
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