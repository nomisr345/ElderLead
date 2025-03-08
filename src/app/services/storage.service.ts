import { Injectable } from '@angular/core';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import * as firebaseApp from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storage = getStorage(firebaseApp.getApp());

  constructor() { }

  // Generate a unique filename
  generateUniqueFilename(originalName: string): string {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  }

  // Upload file to Firebase Storage
  async uploadFile(filePath: string, file: File): Promise<string> {
    try {
      console.log(`Uploading file to ${filePath}`);
      
      // For local development, use a local data URL instead of Firebase Storage
      if (window.location.hostname === 'localhost') {
        console.warn('Using local storage fallback for development');
        return await this.createLocalImageUrl(file);
      }
      
      // Create a reference to the file location
      const fileRef = ref(this.storage, filePath);
      
      // Use uploadBytesResumable instead of uploadBytes for more reliable uploads
      const uploadTask = uploadBytesResumable(fileRef, file);
      
      // Return a promise that resolves when the upload is complete
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // You can track progress here if needed
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload progress: ${progress}%`);
          },
          (error) => {
            console.error('Error during upload:', error);
            // Fall back to local storage if upload fails
            console.warn('Upload failed, using local storage fallback');
            this.createLocalImageUrl(file)
              .then(resolve)
              .catch(reject);
          },
          () => {
            // Upload completed successfully, get the download URL
            getDownloadURL(uploadTask.snapshot.ref)
              .then((downloadURL) => {
                console.log('File uploaded successfully, download URL:', downloadURL);
                resolve(downloadURL);
              })
              .catch((error) => {
                console.error('Error getting download URL:', error);
                // Fall back to local storage
                this.createLocalImageUrl(file)
                  .then(resolve)
                  .catch(reject);
              });
          }
        );
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      // Fall back to local storage
      return await this.createLocalImageUrl(file);
    }
  }

  // Resize and compress image before upload
  async compressImage(file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.7): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height * (maxWidth / width));
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round(width * (maxHeight / height));
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            
            // Create new file from blob
            const newFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            resolve(newFile);
          }, 'image/jpeg', quality);
        };
        
        img.onerror = () => {
          reject(new Error('Error loading image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
    });
  }

  // Delete file from Firebase Storage
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Skip deletion for data URLs (our local fallback)
      if (fileUrl.startsWith('data:')) {
        console.log('Skipping deletion of local data URL');
        return;
      }
      
      console.log(`Deleting file: ${fileUrl}`);
      
      // Extract the path from the URL if needed
      // This is a simplified approach - you might need more complex URL parsing
      const fileRef = ref(this.storage, fileUrl);
      
      // Delete the file
      await deleteObject(fileRef);
      
      console.log('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(files: File[], basePath: string): Promise<string[]> {
    try {
      const uploadPromises = files.map((file, index) => {
        const filePath = `${basePath}/${this.generateUniqueFilename(file.name)}`;
        return this.uploadFile(filePath, file);
      });
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  // Upload community image
  async uploadCommunityImage(communityId: string, file: File): Promise<string> {
    try {
      // First compress the image to reduce its size
      const compressedFile = await this.compressImage(file, 800, 800, 0.7);
      console.log(`Original file size: ${file.size} bytes, Compressed file size: ${compressedFile.size} bytes`);
      
      const filePath = `community_images/${communityId}/${this.generateUniqueFilename(file.name)}`;
      return this.uploadFile(filePath, compressedFile);
    } catch (error) {
      console.error('Error compressing/uploading community image:', error);
      throw error;
    }
  }

  // Upload message file/image
  async uploadMessageFile(communityId: string, messageId: string, file: File): Promise<string> {
    try {
      let fileToUpload = file;
      
      // If it's an image, compress it first
      if (file.type.startsWith('image/')) {
        fileToUpload = await this.compressImage(file, 800, 800, 0.7);
      }
      
      const filePath = `community_messages/${communityId}/${messageId}_${this.generateUniqueFilename(file.name)}`;
      return this.uploadFile(filePath, fileToUpload);
    } catch (error) {
      console.error('Error uploading message file:', error);
      throw error;
    }
  }

  // Create a data URL from a file (useful for local preview)
  createLocalImageUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  }

  // Check if a URL is a data URL (for local development)
  isDataUrl(url: string): boolean {
    if (!url) return false;
    return url.startsWith('data:');
  }
}