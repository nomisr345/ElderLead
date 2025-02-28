import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import * as firebaseApp from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
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
      const credential = await this.afAuth.signInWithEmailAndPassword(email, password);
      
      // Update last login timestamp using modular Firebase API
      if (credential.user) {
        try {
          const app = firebase.app();
          const db = getFirestore(firebaseApp.getApp());
          const userDocRef = doc(db, 'users', credential.user.uid);
          await updateDoc(userDocRef, {
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
          });
        } catch (err) {
          console.log('Could not update last login, but login successful');
        }
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
      
      // Update or create user data in Firestore using modular Firebase API
      if (credential.user) {
        try {
          const db = getFirestore(firebaseApp.getApp());
          const userDocRef = doc(db, 'users', credential.user.uid);
          const docSnap = await getDoc(userDocRef);
          
          // Determine if this is a new user
          const isNewUser = credential.additionalUserInfo?.isNewUser || !docSnap.exists();
          
          // Default to elderly/senior user type for new Google sign-ins
          const userData: any = {
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
          
          await setDoc(userDocRef, userData, { merge: true });
          console.log('Google user data saved successfully');
        } catch (error) {
          console.error('Error saving Google user data:', error);
          // Still return the credential even if data saving fails
        }
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
        
        // Create user document using modular Firebase API
        try {
          const db = getFirestore(firebaseApp.getApp());
          const userDocRef = doc(db, 'users', userId);
          await setDoc(userDocRef, userDoc);
          console.log('User document created successfully');
        } catch (firestoreError) {
          console.error('Error creating user document:', firestoreError);
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
      const db = getFirestore(firebaseApp.getApp());
      const userDocRef = doc(db, 'users', userId);
      
      // Add timestamp
      profileData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      
      await updateDoc(userDocRef, profileData);
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

  // Initialize Firestore collections
  async initializeFirestoreCollections() {
    try {
      // Check if 'users' collection exists using modular Firebase API
      const db = getFirestore(firebaseApp.getApp());
      const usersCollectionRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollectionRef);
      
      // If collection is empty, create a placeholder document
      if (querySnapshot.empty) {
        console.log('Initializing users collection with placeholder');
        const placeholderRef = doc(db, 'users', 'placeholder');
        await setDoc(placeholderRef, {
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

  // Alias for signOut for compatibility
  async logout() {
    return this.signOut();
  }
}