import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  onSnapshot,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { Activity } from '../services/models/activity';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

@Injectable({
  providedIn: 'root',
})
export class BookedActivitiesService {
  private firestore;
  private bookingsRef;
  private storage;

  constructor(private authService: AuthService) {
    const app = initializeApp(environment.firebase);
    this.firestore = getFirestore(app);
    this.bookingsRef = collection(this.firestore, 'bookings');
    this.storage = getStorage(app)
  }


  async bookActivity(activity: Activity): Promise<void> {
    try {
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        console.error('No authenticated user!');
        throw new Error('User not logged in');
      }

      const userId = currentUser.uid;


      const q = query(this.bookingsRef, where('userId', '==', userId), where('activityId', '==', activity.id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        console.warn('User has already booked this activity!');
        throw new Error('You have already booked this activity.');
      }

  
      await addDoc(this.bookingsRef, {
        userId,
        activityId: activity.id,
        title: activity.title,
        description: activity.description,
        startTime: activity.startTime,  
        endTime: activity.endTime,
        location: activity.location,
        category: activity.category,
        instructorName: activity.instructorName,
        instructorCert: activity.instructorCert,
        imagePath: activity.imagePath || '', // Ensure optional field is handled
        timestamp: new Date(),
      });

      console.log('Booking saved successfully!');
    } catch (error) {
      console.error('Error saving booking:', error);
      throw error;
    }
  }


  getBookedActivities(): Observable<Activity[]> {
    return new Observable((observer) => {
      const unsubscribe = onSnapshot(this.bookingsRef, (querySnapshot) => {
        const activities: Activity[] = [];
  
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const activity = new Activity(
            data['title'],
            data['description'],
            this.convertToDate(data['startTime']),
            this.convertToDate(data['endTime']),
            data['location'],
            data['category'],
            data['instructorName'],
            data['instructorCert'],
            data['imagePath'], // Include imagePath
            doc.id
          );
          activities.push(activity);
        });
  
        observer.next(activities);
      });
  
      return () => unsubscribe();
    });
  }

   
    getBookedActivityById(activityId: string): Observable<Activity | null> {
      const bookingDocRef = doc(this.firestore, 'bookings', activityId);
      
      return new Observable((observer) => {
        getDoc(bookingDocRef)
          .then((docSnap) => {
            if (!docSnap.exists()) {
              observer.next(null);  // Return null if the document does not exist
              return;
            }
  
            const data = docSnap.data();
            const activity = new Activity(
              data['title'],
              data['description'],
              this.convertToDate(data['startTime']),
              this.convertToDate(data['endTime']),
              data['location'],
              data['category'],
              data['instructorName'],
              data['instructorCert'],
              data['imagePath'], // Optional field
              docSnap.id
            );
            
            observer.next(activity);
          })
          .catch((error) => {
            console.error('Error fetching activity:', error);
            observer.error(error);  // Emit an error if there is an issue fetching the document
          });
      });
    }

    getBookedActivitiesForUser(userId: string): Observable<Activity[]> {
      const q = query(this.bookingsRef, where('userId', '==', userId));
      return new Observable((observer) => {
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const activities: Activity[] = [];
  
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const activity = new Activity(
              data['title'],
              data['description'],
              this.convertToDate(data['startTime']),
              this.convertToDate(data['endTime']),
              data['location'],
              data['category'],
              data['instructorName'],
              data['instructorCert'],
              data['imagePath'], // Optional field
              doc.id
            );
            activities.push(activity);
          });
  
          observer.next(activities);
        });
  
        return () => unsubscribe();
      });
    }
  

async cancelSession(activity: Activity): Promise<void> {
  const bookingDocRef = doc(this.firestore, 'bookings', activity.id);

  try {
    // Fetch the document to check if it exists
    const docSnap = await getDoc(bookingDocRef);

    if (docSnap.exists()) {
      // If the booking exists, delete the document
      await deleteDoc(bookingDocRef);
      console.log(`Booking for activity with ID ${activity.id} canceled successfully.`);
    } else {
      // If the document doesn't exist, throw an error
      throw new Error('Booking does not exist.');
    }
  } catch (error) {
    console.error('Error canceling booking:', error);
    throw error;
  }
}


  private convertToDate(timestamp: any): Date {
    return timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  }
  
}
