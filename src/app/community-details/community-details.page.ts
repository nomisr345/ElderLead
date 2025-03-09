import { Component, OnInit } from '@angular/core';
import { IonicModule, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Community } from '../models/community.model';
import { getFirestore, doc, getDoc, deleteDoc, collection, query, where, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import * as firebaseApp from 'firebase/app';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-community-details',
  templateUrl: './community-details.page.html',
  styleUrls: ['./community-details.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class CommunityDetailsPage implements OnInit {
  communityId: string = '';
  community: Community | null = null;
  members: any[] = [];
  userRole: string | null = null;
  isCurrentUserMember: boolean = false;
  isLoading: boolean = true;
  isOwner: boolean = false;
  isAdmin: boolean = false;
  currentUserId: string | null = null;
  private db = getFirestore(firebaseApp.getApp());

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('communityId');
      if (id) {
        this.communityId = id;
        console.log('Loading community details for:', id);
        this.loadCommunityData();
      } else {
        this.router.navigate(['/community']);
      }
    });
  }

  async loadCommunityData() {
    this.isLoading = true;
    
    try {
      // Get current user
      const user = await this.authService.getCurrentUser();
      this.currentUserId = user ? user.uid : null;
      
      // Get community document directly from Firestore
      const communityRef = doc(this.db, 'communities', this.communityId);
      const communityDoc = await getDoc(communityRef);
      
      if (!communityDoc.exists()) {
        console.log('Community not found');
        this.community = null;
        this.isLoading = false;
        return;
      }
      
      // Convert doc data to Community object
      this.community = communityDoc.data() as Community;
      
      // Check if user is a member
      if (this.currentUserId) {
        const memberRef = doc(this.db, 'communityMembers', `${this.communityId}_${this.currentUserId}`);
        const memberDoc = await getDoc(memberRef);
        
        if (memberDoc.exists()) {
          this.isCurrentUserMember = true;
          this.userRole = memberDoc.data()['role'];
          this.isOwner = this.userRole === 'owner';
          this.isAdmin = this.userRole === 'admin';
        } else {
          this.isCurrentUserMember = false;
          this.userRole = null;
          this.isOwner = false;
          this.isAdmin = false;
        }
        
        // Get members
        await this.loadMembers();
      }
      
      this.isLoading = false;
      
    } catch (error) {
      console.error('Error in loadCommunityData:', error);
      this.isLoading = false;
    }
  }
  
  async loadMembers() {
    try {
      const membersRef = collection(this.db, 'communityMembers');
      const membersQuery = query(membersRef, where('communityId', '==', this.communityId));
      const membersSnapshot = await getDocs(membersQuery);
      
      const memberPromises = membersSnapshot.docs.map(async (doc) => {
        const memberData = doc.data();
        const userId = memberData['userId'];
        
        // Get user data
        const userData = await this.authService.getUserData(userId);
        
        return {
          ...userData,
          role: memberData['role'],
          joinedAt: memberData['joinedAt']
        };
      });
      
      this.members = await Promise.all(memberPromises);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  // Join a community
  async joinCommunity() {
    if (!this.currentUserId) {
      this.router.navigate(['/login']);
      return;
    }
    
    const loading = await this.loadingController.create({
      message: 'Joining community...'
    });
    await loading.present();
    
    try {
      // Create membership document
      const memberRef = doc(this.db, 'communityMembers', `${this.communityId}_${this.currentUserId}`);
      
      // Check if already a member
      const memberDoc = await getDoc(memberRef);
      if (memberDoc.exists()) {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: 'You are already a member of this community',
          duration: 2000,
          color: 'warning'
        });
        await toast.present();
        return;
      }
      
      // Add membership
      await setDoc(memberRef, {
        communityId: this.communityId,
        userId: this.currentUserId,
        role: 'member',
        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update member count
      if (this.community) {
        const communityRef = doc(this.db, 'communities', this.communityId);
        await updateDoc(communityRef, {
          memberCount: firebase.firestore.FieldValue.increment(1)
        });
      }
      
      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: 'Successfully joined the community!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      
      // Refresh data
      this.loadCommunityData();
      
      // Navigate to chat page
      this.router.navigate(['/community-chat', this.communityId]);
    } catch (error) {
      console.error('Error joining community:', error);
      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: 'Failed to join community. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  // Leave a community
  async leaveCommunity() {
    const alert = await this.alertController.create({
      header: 'Leave Community',
      message: 'Are you sure you want to leave this community?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Yes, Leave',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Leaving community...'
            });
            await loading.present();
            
            try {
              // Delete membership document
              const memberRef = doc(this.db, 'communityMembers', `${this.communityId}_${this.currentUserId}`);
              await deleteDoc(memberRef);
              
              // Update member count
              if (this.community) {
                const communityRef = doc(this.db, 'communities', this.communityId);
                await updateDoc(communityRef, {
                  memberCount: firebase.firestore.FieldValue.increment(-1)
                });
              }
              
              await loading.dismiss();
              
              const toast = await this.toastController.create({
                message: 'You have left the community',
                duration: 2000,
                color: 'primary'
              });
              await toast.present();
              
              // Navigate back to communities list
              this.router.navigate(['/community']);
            } catch (error) {
              console.error('Error leaving community:', error);
              await loading.dismiss();
              
              const toast = await this.toastController.create({
                message: 'Failed to leave community. Please try again.',
                duration: 3000,
                color: 'danger'
              });
              await toast.present();
            }
          }
        }
      ]
    });
    
    await alert.present();
  }

  // Delete community (owner only)
  async deleteCommunity() {
    const alert = await this.alertController.create({
      header: 'Delete Community',
      message: 'Are you sure you want to delete this community? This action cannot be undone!',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Yes, Delete',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Deleting community...'
            });
            await loading.present();
            
            try {
              // Delete all messages
              const messagesRef = collection(this.db, 'communityMessages');
              const messagesQuery = query(messagesRef, where('communityId', '==', this.communityId));
              const messagesSnapshot = await getDocs(messagesQuery);
              
              for (const docSnapshot of messagesSnapshot.docs) {
                await deleteDoc(docSnapshot.ref);
              }
              
              // Delete all memberships
              const membersRef = collection(this.db, 'communityMembers');
              const membersQuery = query(membersRef, where('communityId', '==', this.communityId));
              const membersSnapshot = await getDocs(membersQuery);
              
              for (const docSnapshot of membersSnapshot.docs) {
                await deleteDoc(docSnapshot.ref);
              }
              
              // Delete community document
              await deleteDoc(doc(this.db, 'communities', this.communityId));
              
              await loading.dismiss();
              
              const toast = await this.toastController.create({
                message: 'Community deleted successfully',
                duration: 2000,
                color: 'primary'
              });
              await toast.present();
              
              // Navigate back to communities list
              this.router.navigate(['/community']);
            } catch (error) {
              console.error('Error deleting community:', error);
              await loading.dismiss();
              
              const toast = await this.toastController.create({
                message: 'Failed to delete community. Please try again.',
                duration: 3000,
                color: 'danger'
              });
              await toast.present();
            }
          }
        }
      ]
    });
    
    await alert.present();
  }

  // Format date
  formatDate(timestamp: any): string {
    if (!timestamp) {
      return 'N/A';
    }
    
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  }

  // Go to community chat
  goToChat() {
    this.router.navigate(['/community-chat', this.communityId]);
  }

  // Go to community management (for owners and admins)
  goToManagement() {
    this.router.navigate(['/community-management', this.communityId]);
  }

  // Get user role badge color
  getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'owner':
        return 'danger';
      case 'admin':
        return 'warning';
      default:
        return 'medium';
    }
  }
}