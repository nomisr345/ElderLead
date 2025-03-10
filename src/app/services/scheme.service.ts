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
  Timestamp} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Scheme } from './models/scheme';

@Injectable({
  providedIn: 'root',
})
export class SchemeService {
  private firestore;
  private schemesRef;
  private storage;

  constructor() {
    const app = initializeApp(environment.firebase);
    this.firestore = getFirestore(app);
    this.schemesRef = collection(this.firestore, 'schemes'); // Corrected reference
    this.storage = getStorage(app);
  }

  // Fetch all schemes
  getSchemes(): Observable<Scheme[]> {
    return new Observable((observer) => {
      const unsubscribe = onSnapshot(this.schemesRef, (querySnapshot) => {
        const schemes: Scheme[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const scheme = new Scheme(
            data['title'],
            data['highlights'],
            this.convertToDate(data['applicationPeriod']),
            this.convertToDate(data['startDate']),
            this.convertToDate(data['endDate']),
            data['eligibility'],
            data['imagePath'], // Include image path
            doc.id
          );
          schemes.push(scheme);
        });

        observer.next(schemes);
      });

      return () => unsubscribe();
    });
  }

  // Fetch a single scheme by ID
  getSchemeById(id: string): Observable<Scheme> {
    return new Observable((observer) => {
      const schemeDoc = doc(this.firestore, 'schemes', id);

      getDoc(schemeDoc)
        .then((docSnap) => {
          if (!docSnap.exists()) {
            observer.error('Scheme not found');
            return;
          }

          const data = docSnap.data();
          const scheme = new Scheme(
            data!['title'],
            data!['highlights'],
            this.convertToDate(data!['applicationPeriod']),
            this.convertToDate(data['startDate']),
            this.convertToDate(data['endDate']),
            data!['eligibility'],
            data!['imagePath'],
            docSnap.id
          );
          observer.next(scheme);
        })
        .catch((error) => observer.error(error));
    });
  }

  // Add a new scheme
  async add(scheme: Scheme, imageFile?: File): Promise<void> {
    try {
      let imageUrl = scheme.imagePath || '';

      if (imageFile) {
        const { downloadURL } = await this.uploadImage(imageFile);
        imageUrl = downloadURL;
      }

      await addDoc(this.schemesRef, {
        title: scheme.title,
        highlights: scheme.highlights,
        applicationPeriod: scheme.applicationPeriod ? Timestamp.fromDate(new Date(scheme.applicationPeriod)) : null,
        startDate: scheme.startDate ? Timestamp.fromDate(new Date(scheme.startDate)) : null,
        endDate: scheme.endDate ? Timestamp.fromDate(new Date(scheme.endDate)) : null,
        eligibility: scheme.eligibility,
        imagePath: imageUrl,
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

  // Update an existing scheme
  async updateScheme(scheme: Scheme, imageFile?: File): Promise<void> {
    try {
      let imageUrl = scheme.imagePath;

      if (imageFile) {
        const { downloadURL } = await this.uploadImage(imageFile);
        imageUrl = downloadURL;
      }

      const schemeDocRef = doc(this.firestore, 'schemes', scheme.id);
      const updatedData = {
        title: scheme.title,
        highlights: scheme.highlights,
        applicationPeriod: scheme.applicationPeriod instanceof Date ? Timestamp.fromDate(scheme.applicationPeriod) : scheme.applicationPeriod,
        startDate: scheme.startDate instanceof Date ? Timestamp.fromDate(scheme.startDate) : scheme.startDate,
        endDate: scheme.endDate instanceof Date ? Timestamp.fromDate(scheme.endDate) : scheme.endDate,
        eligibility: scheme.eligibility,
        imagePath: imageUrl,
      };

      await updateDoc(schemeDocRef, updatedData);
      console.log(`Scheme with ID ${scheme.id} updated successfully.`);
    } catch (error) {
      console.error('Error updating scheme:', error);
      throw error;
    }
  }

  // Delete a scheme
  async delete(scheme: Scheme): Promise<void> {
    const schemeDocRef = doc(this.firestore, 'schemes', scheme.id);

    return getDoc(schemeDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          return deleteDoc(schemeDocRef);
        } else {
          throw new Error('Scheme does not exist.');
        }
      })
      .then(() => {
        console.log(`Scheme with ID ${scheme.id} deleted successfully.`);
      })
      .catch((error) => {
        console.error('Error deleting scheme:', error);
        throw error;
      });
  }

  // Upload image to Firebase Storage and return the download URL
  async uploadImage(file: File): Promise<{ filePath: string; downloadURL: string }> {
    const filePath = `schemes/${new Date().getTime()}_${file.name}`;
    const fileRef = ref(this.storage, filePath);

    try {
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return { filePath, downloadURL };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image: ' + (error as Error).message);
    }
  }

  // Convert Firestore Timestamp to JavaScript Date
  private convertToDate(date: Timestamp | string): Date {
    if (date instanceof Timestamp) {
      return date.toDate();
    }
    return new Date(date);
  }
}
