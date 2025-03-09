import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { Observable, from, of, combineLatest } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import * as firebaseApp from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, 
         query, where, orderBy, limit, deleteDoc, arrayUnion, arrayRemove, 
         DocumentData, QueryDocumentSnapshot, DocumentReference, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Community, CommunityMember, CommunityMessage } from '../models/community.model';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private db = getFirestore(firebaseApp.getApp());

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private storageService: StorageService
  ) { }

  // Get all communities - directly through AngularFirestore
  getAllCommunities(): Observable<Community[]> {
    return this.firestore.collection<Community>('communities', 
      ref => ref.orderBy('createdAt', 'desc')
    ).valueChanges();
  }

  // Get public communities - directly through AngularFirestore
  getPublicCommunities(): Observable<Community[]> {
    return this.firestore.collection<Community>('communities', 
      ref => ref.where('isPublic', '==', true).orderBy('createdAt', 'desc')
    ).valueChanges();
  }

  // Get communities by user ID (communities the user is a member of)
  getUserCommunities(userId: string): Observable<any[]> {
    // First get the communities the user is a member of
    return this.firestore.collection<CommunityMember>('communityMembers', 
      ref => ref.where('userId', '==', userId)
    ).valueChanges().pipe(
      switchMap(memberships => {
        const communityIds = memberships.map(m => m.communityId);
        
        if (communityIds.length === 0) {
          return of([]);
        }
        
        // Get the actual community data for each membership
        return this.firestore.collection<Community>('communities', 
          ref => ref.where(firebase.firestore.FieldPath.documentId(), 'in', communityIds)
        ).valueChanges().pipe(
          map(communities => {
            // Merge community data with membership data
            return communities.map(community => {
              const membership = memberships.find(m => m.communityId === community.communityId);
              return {
                ...community,
                role: membership ? membership.role : null,
                joinedAt: membership ? membership.joinedAt : null
              };
            });
          })
        );
      })
    );
  }

  // Get a single community by ID
  getCommunity(communityId: string): Observable<Community | null> {
    return this.firestore.doc<Community>(`communities/${communityId}`).valueChanges().pipe(
      map(community => community || null) // Convert undefined to null
    );
  }

  // Create a new community
  async createCommunity(communityData: Partial<Community>, imageFile?: File): Promise<string> {
    try {
      // Get current user
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Generate a new ID
      const communityId = this.firestore.createId();
      
      // Default image URL
      let imageUrl = 'assets/green_park.jpg';

      // If an image file is provided, upload it to storage
      if (imageFile) {
        try {
          imageUrl = await this.storageService.uploadCommunityImage(communityId, imageFile);
          console.log('Community image uploaded successfully:', imageUrl);
        } catch (error) {
          console.error('Error uploading community image, using default:', error);
          // Continue with default image if upload fails
        }
      }

      // Prepare community document with updated fields
      const newCommunity: Community = {
        communityId: communityId,
        name: communityData.name || communityData.communityName || '',
        communityName: communityData.communityName || communityData.name || '',
        short_description: communityData.short_description || '',
        long_description: communityData.long_description || '',
        imageUrl: imageUrl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdByUserId: currentUser.uid,
        memberCount: 1, // Creator is first member
        isPublic: communityData.isPublic !== undefined ? communityData.isPublic : true
      };

      // Create the community document
      const communityRef = doc(this.db, 'communities', communityId);
      await setDoc(communityRef, newCommunity);

      // Add creator as a member with owner role
      await this.addMember(communityId, currentUser.uid, 'owner');

      console.log('Community created successfully:', communityId);
      return communityId;
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  }

  // Update community
  async updateCommunity(communityId: string, updateData: Partial<Community>, imageFile?: File): Promise<void> {
    try {
      // Check if user is owner or admin
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const membership = await this.getMemberRole(communityId, currentUser.uid);
      if (membership !== 'owner' && membership !== 'admin') {
        throw new Error('Not authorized to update this community');
      }

      // If new image is provided, upload it
      if (imageFile) {
        try {
          const imageUrl = await this.storageService.uploadCommunityImage(communityId, imageFile);
          updateData.imageUrl = imageUrl;
        } catch (error) {
          console.error('Error uploading community image:', error);
          // Continue without updating image if upload fails
        }
      }

      // Update the community document
      const communityRef = doc(this.db, 'communities', communityId);
      await updateDoc(communityRef, {
        ...updateData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('Community updated successfully:', communityId);
    } catch (error) {
      console.error('Error updating community:', error);
      throw error;
    }
  }

  // Delete community
  async deleteCommunity(communityId: string): Promise<void> {
    try {
      // Check if user is owner
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const membership = await this.getMemberRole(communityId, currentUser.uid);
      if (membership !== 'owner') {
        throw new Error('Only the owner can delete a community');
      }

      // Delete all messages in the community
      const messagesQuery = query(
        collection(this.db, 'communityMessages'),
        where('communityId', '==', communityId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const deleteMessagePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteMessagePromises);

      // Delete all memberships
      const membersQuery = query(
        collection(this.db, 'communityMembers'),
        where('communityId', '==', communityId)
      );
      const membersSnapshot = await getDocs(membersQuery);
      const deleteMemberPromises = membersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteMemberPromises);

      // Delete the community document
      await deleteDoc(doc(this.db, 'communities', communityId));

      console.log('Community deleted successfully:', communityId);
    } catch (error) {
      console.error('Error deleting community:', error);
      throw error;
    }
  }

  // Add a member to a community
  async addMember(communityId: string, userId: string, role: string = 'member'): Promise<void> {
    try {
      // Check if already a member
      const memberRef = doc(this.db, 'communityMembers', `${communityId}_${userId}`);
      const memberDoc = await getDoc(memberRef);
      
      if (memberDoc.exists()) {
        console.log('User is already a member of this community');
        return;
      }

      // Add membership document
      const memberData: CommunityMember = {
        communityId,
        userId,
        role,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await setDoc(memberRef, memberData);

      // Update member count in community
      const communityRef = doc(this.db, 'communities', communityId);
      await updateDoc(communityRef, {
        memberCount: firebase.firestore.FieldValue.increment(1)
      });

      console.log('Member added successfully:', userId);
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }

  // Remove a member from a community
  async removeMember(communityId: string, userId: string): Promise<void> {
    try {
      // Check if current user is owner or admin, or removing self
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Users can remove themselves, or owners/admins can remove others
      if (currentUser.uid !== userId) {
        const currentUserRole = await this.getMemberRole(communityId, currentUser.uid);
        const targetUserRole = await this.getMemberRole(communityId, userId);
        
        // Only owners can remove admins
        if (targetUserRole === 'admin' && currentUserRole !== 'owner') {
          throw new Error('Only owners can remove admins');
        }
        
        // Admins and owners can remove regular members
        if (currentUserRole !== 'owner' && currentUserRole !== 'admin') {
          throw new Error('Not authorized to remove members');
        }
      }

      // Delete membership document
      const memberRef = doc(this.db, 'communityMembers', `${communityId}_${userId}`);
      await deleteDoc(memberRef);

      // Update member count in community
      const communityRef = doc(this.db, 'communities', communityId);
      await updateDoc(communityRef, {
        memberCount: firebase.firestore.FieldValue.increment(-1)
      });

      console.log('Member removed successfully:', userId);
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  // Update member role
  async updateMemberRole(communityId: string, userId: string, newRole: string): Promise<void> {
    try {
      // Check if current user is owner
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const currentUserRole = await this.getMemberRole(communityId, currentUser.uid);
      if (currentUserRole !== 'owner') {
        throw new Error('Only owners can change roles');
      }

      // Update role in membership document
      const memberRef = doc(this.db, 'communityMembers', `${communityId}_${userId}`);
      await updateDoc(memberRef, { role: newRole });

      console.log('Member role updated successfully:', userId);
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  // Get members of a community
  getCommunityMembers(communityId: string): Observable<any[]> {
    return this.firestore.collection<CommunityMember>('communityMembers', 
      ref => ref.where('communityId', '==', communityId)
    ).valueChanges().pipe(
      switchMap(members => {
        const userIds = members.map(m => m.userId);
        
        if (userIds.length === 0) {
          return of([]);
        }
        
        // For each member, get their user data
        const userObservables = userIds.map(userId => 
          from(this.authService.getUserData(userId)).pipe(
            map(userData => ({
              ...userData,
              role: members.find(m => m.userId === userId)?.role,
              joinedAt: members.find(m => m.userId === userId)?.joinedAt
            }))
          )
        );
        
        return combineLatest(userObservables);
      })
    );
  }

  // Get role of a member in a community
  async getMemberRole(communityId: string, userId: string): Promise<string | null> {
    try {
      const memberRef = doc(this.db, 'communityMembers', `${communityId}_${userId}`);
      const memberDoc = await getDoc(memberRef);
      
      if (memberDoc.exists()) {
        return memberDoc.data()['role'];
      }
      
      return null; // Not a member
    } catch (error) {
      console.error('Error getting member role:', error);
      throw error;
    }
  }

  // Check if user is a member of a community
  async isMember(communityId: string, userId: string): Promise<boolean> {
    try {
      const role = await this.getMemberRole(communityId, userId);
      return role !== null;
    } catch (error) {
      console.error('Error checking membership:', error);
      throw error;
    }
  }

  // Join a community
  async joinCommunity(communityId: string): Promise<void> {
    try {
      // Get current user
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Check if community is public
      const communityRef = doc(this.db, 'communities', communityId);
      const communityDoc = await getDoc(communityRef);
      
      if (!communityDoc.exists()) {
        throw new Error('Community not found');
      }
      
      const communityData = communityDoc.data() as Community;
      if (!communityData.isPublic) {
        throw new Error('This community is private. You need an invitation to join.');
      }

      // Add as member
      await this.addMember(communityId, currentUser.uid);

      console.log('Joined community successfully:', communityId);
    } catch (error) {
      console.error('Error joining community:', error);
      throw error;
    }
  }

  // Leave a community
  async leaveCommunity(communityId: string): Promise<void> {
    try {
      // Get current user
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Check if user is the owner
      const role = await this.getMemberRole(communityId, currentUser.uid);
      if (role === 'owner') {
        throw new Error('The owner cannot leave the community. Transfer ownership or delete the community instead.');
      }

      // Remove as member
      await this.removeMember(communityId, currentUser.uid);

      console.log('Left community successfully:', communityId);
    } catch (error) {
      console.error('Error leaving community:', error);
      throw error;
    }
  }

  // Send a message to a community
  async sendMessage(communityId: string, content: string, type: string = 'text', file?: File): Promise<string> {
    try {
      // Get current user
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Check if user is a member
      const isMember = await this.isMember(communityId, currentUser.uid);
      if (!isMember) {
        throw new Error('You must be a member to send messages');
      }

      // Get user data for sender info
      const userData = await this.authService.getUserData(currentUser.uid);
      if (!userData) {
        throw new Error('User data not found');
      }

      // Generate message ID
      const messageId = this.firestore.createId();
      
      // Default values for file properties
      let fileUrl = '';
      let fileName = '';
      let fileSize = 0;

      // If a file is provided, upload it to Firebase Storage
      if (file) {
        // Set file properties
        fileName = file.name;
        fileSize = file.size;
        
        // Choose the appropriate path and upload method based on file type
        if (type === 'image') {
          // For image files
          fileUrl = await this.storageService.uploadMessageFile(communityId, messageId, file);
        } else {
          // For other file types
          fileUrl = await this.storageService.uploadMessageFile(communityId, messageId, file);
        }
        
        console.log(`File uploaded successfully. Type: ${type}, URL: ${fileUrl}`);
      }

      // Create message document
      const message: CommunityMessage = {
        communityId,
        messageId,
        senderId: currentUser.uid,
        senderName: userData['displayName'] || userData['name'] || 'Unknown User',
        senderPhotoURL: userData['photoURL'] || '',
        content,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type,
        fileUrl,
        fileName,
        fileSize
      };

      // Save message to Firestore
      const messageRef = doc(this.db, 'communityMessages', messageId);
      await setDoc(messageRef, message);

      console.log('Message sent successfully:', messageId);
      return messageId;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get messages for a community
  getCommunityMessages(communityId: string, messageLimit: number = 20): Observable<CommunityMessage[]> {
    // Using direct Firestore SDK methods instead of AngularFirestore
    return new Observable<CommunityMessage[]>(observer => {
      const messagesRef = collection(this.db, 'communityMessages');
      const messagesQuery = query(
        messagesRef,
        where('communityId', '==', communityId),
        orderBy('timestamp', 'desc'),
        limit(messageLimit) // Changed variable name to avoid conflict
      );
      
      // Create the listener
      const unsubscribe = onSnapshot(
        messagesQuery, 
        (snapshot: any) => {
          try {
            const messages = snapshot.docs.map((doc: any) => doc.data() as CommunityMessage);
            observer.next(messages.reverse()); // Reverse to get chronological order
          } catch (error: any) {
            observer.error(error);
          }
        },
        (error: any) => {
          observer.error(error);
        }
      );
      
      // Return the unsubscribe function to clean up when the observable is unsubscribed
      return () => unsubscribe();
    });
  }

  // Search messages by content or file name
  searchCommunityMessages(communityId: string, searchTerm: string): Observable<CommunityMessage[]> {
    return this.getCommunityMessages(communityId, 100).pipe(
      map(messages => {
        const term = searchTerm.toLowerCase();
        return messages.filter(message => 
          message.content.toLowerCase().includes(term) || 
          (message.fileName && message.fileName.toLowerCase().includes(term)) ||
          (message.type.toLowerCase().includes(term))
        );
      })
    );
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    try {
      // Get message data
      const messageRef = doc(this.db, 'communityMessages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }
      
      const messageData = messageDoc.data() as CommunityMessage;
      
      // Check permissions (sender or admin/owner can delete)
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const userRole = await this.getMemberRole(messageData.communityId, currentUser.uid);
      const isSender = messageData.senderId === currentUser.uid;
      
      if (!isSender && userRole !== 'owner' && userRole !== 'admin') {
        throw new Error('Not authorized to delete this message');
      }
      
      // Delete message document
      await deleteDoc(messageRef);
      
      console.log('Message deleted successfully:', messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Search communities by name
  searchCommunities(searchTerm: string): Observable<Community[]> {
    return this.firestore.collection<Community>('communities').valueChanges().pipe(
      map(communities => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return communities.filter(community => 
          (community.name && community.name.toLowerCase().includes(lowerSearchTerm)) || 
          (community.communityName && community.communityName.toLowerCase().includes(lowerSearchTerm)) ||
          (community.short_description && community.short_description.toLowerCase().includes(lowerSearchTerm)) ||
          (community.long_description && community.long_description.toLowerCase().includes(lowerSearchTerm))
        );
      })
    );
  }
}