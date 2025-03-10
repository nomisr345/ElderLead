import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore'; 
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';  // Import Firebase Storage functions
import { from, Observable, of, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Activity } from './models/activity';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private firestore;
  private activitiesRef;
  private storage;

  constructor(private authService: AuthService) {
    const app = initializeApp(environment.firebase);
    this.firestore = getFirestore(app);
    this.activitiesRef = collection(this.firestore, 'Activities');
    this.storage = getStorage(app); // Initialize Firebase Storage
  }

  // Fetch all activities
  getActivities(): Observable<Activity[]> {
    return new Observable((observer) => {
      const unsubscribe = onSnapshot(this.activitiesRef, (querySnapshot) => {
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

  // Fetch a single activity by ID
  getActivityById(id: string): Observable<Activity> {
    return new Observable((observer) => {
      const activityDoc = doc(this.firestore, 'Activities', id);

      getDoc(activityDoc)
        .then((docSnap) => {
          if (!docSnap.exists()) {
            observer.error('Activity not found');
            return;
          }

          const data = docSnap.data();
          const activity = new Activity(
            data!['title'],
            data!['description'],
            this.convertToDate(data['startTime']),
            this.convertToDate(data['endTime']),
            data!['location'],
            data['category'],
            data['instructorName'],
            data['instructorCert'],
            data['imagePath'], // Include imagePath
            docSnap.id
          );
          observer.next(activity);
        })
        .catch((error) => observer.error(error));
    });
  }

  // Add a new activity
  async add(activity: Activity, imageFile?: File): Promise<void> {
    try {

      let imageUrl = activity.imagePath;  // Default to existing imagePath if no new image is provided

      if (imageFile) {
        // If a new image file is provided, upload it and get the download URL
        const { downloadURL } = await this.uploadImage(imageFile);
        imageUrl = downloadURL;  // Use the new image's download URL
      }
  
      // Save the activity along with the image URL (if any)
      await addDoc(this.activitiesRef, {
        title: activity.title,
        description: activity.description,
        startTime: Timestamp.fromDate(new Date(activity.startTime)),
        endTime: Timestamp.fromDate(new Date(activity.endTime)),
        location: activity.location,
        category: activity.category,
        instructorName: activity.instructorName,
        instructorCert: activity.instructorCert,
        imagePath: imageUrl // Save image URL to Firestore
      });
      console.log('Activity added successfully.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error adding activity:', error.message);
        throw new Error('Failed to add activity: ' + error.message);
      } else {
        console.error('An unknown error occurred:', error);
        throw new Error('Failed to add activity: Unknown error occurred');
      }
    }
  }

  // Update an existing activity
  async update(activity: Activity, imageFile?: File): Promise<void> {
    try {
      let imageUrl = activity.imagePath;  // Use existing image URL by default


      const activityDocRef = doc(this.firestore, 'Activities', activity.id);
      const updatedData: any = {
        title: activity.title,
        description: activity.description,
        startTime: activity.startTime instanceof Date ? Timestamp.fromDate(activity.startTime) : activity.startTime,
        endTime: activity.endTime instanceof Date ? Timestamp.fromDate(activity.endTime) : activity.endTime,
        location: activity.location,
        category: activity.category,
        instructorName: activity.instructorName,
        instructorCert: activity.instructorCert,
        imagePath: activity.imagePath,  // Ensure the image URL is updated
      };

      await updateDoc(activityDocRef, updatedData);
      console.log(`Activity with ID ${activity.id} updated successfully.`);
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  }

  // Delete an activity
  delete(activity: Activity): Promise<void> {
    const activityDocRef = doc(this.firestore, 'Activities', activity.id);

    return getDoc(activityDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          return deleteDoc(activityDocRef);
        } else {
          throw new Error('Activity does not exist.');
        }
      })
      .then(() => {
        console.log(`Activity with ID ${activity.id} deleted successfully.`);
      })
      .catch((error) => {
        console.error('Error deleting activity:', error);
        throw error;
      });
  }

  // Upload image to Firebase Storage and return the download URL
 // Upload image to Firebase Storage and return the download URL
uploadImage(file: File): Promise<{ filePath: string; downloadURL: string }> {
  const filePath = `images/${new Date().getTime()}_${file.name}`;  // Use timestamp to create unique file path
  const fileRef = ref(this.storage, filePath);  // Get a reference to the Firebase Storage location

  return uploadBytes(fileRef, file)  // Upload the file
    .then(() => {
      return getDownloadURL(fileRef)  // Get the download URL of the uploaded image
        .then((downloadURL) => {
          return { filePath, downloadURL };  // Return both filePath and downloadURL
        });
    })
    .catch((error) => {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image: ' + error.message);
    });
}

  // Convert Firestore Timestamp to JavaScript Date
  private convertToDate(date: Timestamp | string): Date {
    if (date instanceof Timestamp) {
      return date.toDate();
    }
    return new Date(date);
  }
}
