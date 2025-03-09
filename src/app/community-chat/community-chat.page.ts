import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { IonicModule, IonContent, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommunityService } from '../services/community.service';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { Community, CommunityMessage } from '../models/community.model';
import { Subscription } from 'rxjs';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import * as firebaseApp from 'firebase/app';

interface FilePreview {
  file: File;
  type: 'image' | 'file';
  preview?: string; // URL for image preview
  name: string;
  size: number;
}

@Component({
  selector: 'app-community-chat',
  templateUrl: './community-chat.page.html',
  styleUrls: ['./community-chat.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class CommunityChatPage implements OnInit {
  @ViewChild('content') content!: IonContent;
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  community: Community | null = null;
  communityId: string = '';
  messages: CommunityMessage[] = [];
  searchResults: CommunityMessage[] = [];
  newMessage: string = '';
  isLoading: boolean = true;
  currentUserId: string | null = null;
  userRole: string | null = null;
  isOwner: boolean = false;
  isAdmin: boolean = false;
  showSearch: boolean = false;
  searchTerm: string = '';
  
  // New file handling properties
  selectedFiles: FilePreview[] = [];
  maxFiles: number = 2;
  
  // Image viewer properties
  showImageViewer: boolean = false;
  fullImageUrl: string = '';
  
  private messagesSubscription?: Subscription;
  private db = getFirestore(firebaseApp.getApp());

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private communityService: CommunityService,
    private authService: AuthService,
    private storageService: StorageService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('communityId');
      if (id) {
        this.communityId = id;
        this.loadCommunityData();
      } else {
        this.router.navigate(['/community']);
      }
    });
  }

  async loadCommunityData() {
    const loading = await this.loadingController.create({
      message: 'Loading chat...',
      cssClass: 'custom-loading-class'
    });
    
    try {
      await loading.present();
      
      // Get current user
      const user = await this.authService.getCurrentUser();
      this.currentUserId = user ? user.uid : null;
      
      if (!this.currentUserId) {
        await loading.dismiss();
        this.router.navigate(['/login'], { 
          queryParams: { returnUrl: `/community-chat/${this.communityId}` } 
        });
        return;
      }
      
      // Check if user is a member
      const isMember = await this.communityService.isMember(this.communityId, this.currentUserId);
      if (!isMember) {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: 'You need to join this community to access the chat',
          duration: 3000,
          color: 'warning'
        });
        await toast.present();
        this.router.navigate(['/community-details', this.communityId]);
        return;
      }
      
      // Get user role
      this.userRole = await this.communityService.getMemberRole(this.communityId, this.currentUserId);
      this.isOwner = this.userRole === 'owner';
      this.isAdmin = this.userRole === 'admin';
      
      // Load community details directly from Firestore
      const communityRef = doc(this.db, 'communities', this.communityId);
      const communityDoc = await getDoc(communityRef);
      
      if (!communityDoc.exists()) {
        console.log('Community not found');
        this.community = null;
      } else {
        this.community = communityDoc.data() as Community;
      }
      
      // Load messages
      this.loadMessages();
      
      await loading.dismiss();
      this.isLoading = false;
    } catch (error) {
      console.error('Error in loadCommunityData:', error);
      await loading.dismiss();
      this.isLoading = false;
      
      const toast = await this.toastController.create({
        message: 'Error loading chat. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  loadMessages() {
    // Unsubscribe from previous subscription if exists
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
    
    // Subscribe to messages
    this.messagesSubscription = this.communityService.getCommunityMessages(this.communityId, 100).subscribe(
      messages => {
        this.ngZone.run(() => {
          this.messages = messages;
          // Scroll to bottom after messages load
          setTimeout(() => {
            this.scrollToBottom();
          }, 300);
        });
      },
      error => {
        console.error('Error loading messages:', error);
        this.ngZone.run(() => {
          this.messages = [];
        });
      }
    );
  }

  async sendMessage() {
    // Check if there's either a message or files to send
    if ((!this.newMessage || !this.newMessage.trim()) && this.selectedFiles.length === 0) {
      return;
    }
    
    const loading = await this.loadingController.create({
      message: 'Sending...',
      duration: 10000, // Max duration increased for multiple file uploads
      cssClass: 'custom-loading-class'
    });
    
    try {
      await loading.present();
      
      if (this.selectedFiles.length > 0) {
        // For the first file
        const firstFile = this.selectedFiles[0];
        // Send first file with message content
        const firstMessageId = await this.communityService.sendMessage(
          this.communityId,
          this.newMessage.trim(),
          firstFile.type,
          firstFile.file
        );
        
        // If there's a second file, send it as a separate message with empty content
        if (this.selectedFiles.length > 1) {
          const secondFile = this.selectedFiles[1];
          await this.communityService.sendMessage(
            this.communityId,
            '', // Empty content for second file
            secondFile.type,
            secondFile.file
          );
        }
      } else {
        // Send text message only
        await this.communityService.sendMessage(
          this.communityId,
          this.newMessage.trim(),
          'text'
        );
      }
      
      // Clear message input and selected files
      this.newMessage = '';
      this.selectedFiles = [];
      
      await loading.dismiss();
      
      // Scroll to bottom
      this.scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: 'Failed to send message. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  scrollToBottom() {
    if (this.content) {
      this.content.scrollToBottom(300);
    }
  }

  filterMessages(event: any) {
    const query = event.target.value.toLowerCase();
    if (!query) {
      this.searchResults = [];
      return;
    }
    
    this.searchResults = this.messages.filter(message => 
      message.content.toLowerCase().includes(query) || 
      (message.fileName && message.fileName.toLowerCase().includes(query)) ||
      (message.type.toLowerCase().includes(query))
    );
  }

  formatTime(timestamp: any): string {
    if (!timestamp) {
      return '';
    }
    
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) {
      return '';
    }
    
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString();
    } catch (e) {
      return '';
    }
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  openFileSelector() {
    // Reset the file input to allow selecting the same file again
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
    
    // Only open file selector if user hasn't reached the max files limit
    if (this.selectedFiles.length < this.maxFiles) {
      this.fileInput?.nativeElement.click();
    } else {
      this.showMaxFilesWarning();
    }
  }

  async showMaxFilesWarning() {
    const toast = await this.toastController.create({
      message: `You can only attach up to ${this.maxFiles} files per message.`,
      duration: 3000,
      color: 'warning'
    });
    await toast.present();
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if already at max files
    if (this.selectedFiles.length >= this.maxFiles) {
      this.showMaxFilesWarning();
      return;
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const toast = await this.toastController.create({
        message: 'File size should be less than 10MB',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }
    
    // Determine file type
    const fileType = file.type.startsWith('image/') ? 'image' : 'file';
    
    // Create file preview
    const filePreview: FilePreview = {
      file: file,
      type: fileType,
      name: file.name,
      size: file.size
    };
    
    // If it's an image, generate a preview URL
    if (fileType === 'image') {
      filePreview.preview = await this.storageService.createLocalImageUrl(file);
    }
    
    // Add to selected files
    this.selectedFiles.push(filePreview);
  }

  removeFile(index: number) {
    if (index >= 0 && index < this.selectedFiles.length) {
      // Remove the file at the specified index
      this.selectedFiles.splice(index, 1);
    }
  }

  // Updated download file method to handle different URL types and show feedback
  downloadFile(url: string, fileName: string) {
    if (!url) {
      console.warn('Attempted to download file with empty URL');
      return;
    }
    
    // Check if URL is a Firebase Storage URL or data URL
    if (url.startsWith('data:')) {
      // Handle data URL (primarily for development/local testing)
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      this.toastController.create({
        message: 'Download started',
        duration: 2000,
        position: 'bottom'
      }).then(toast => toast.present());
    } else {
      // For Firebase Storage URLs, open in new tab since direct download might not work
      // due to CORS on some mobile browsers
      window.open(url, '_blank');
      
      // Show notification about download
      this.toastController.create({
        message: 'Download started in new tab',
        duration: 3000,
        position: 'bottom'
      }).then(toast => toast.present());
    }
  }

  // Update this method in your community-chat.page.ts file
  // View full image method
  viewFullImage(imageUrl: string) {
    if (!imageUrl) {
      console.warn('Attempted to view full image with empty URL');
      return;
    }
    
    this.fullImageUrl = imageUrl;
    this.showImageViewer = true;
    
    // Prevent body scrolling while image viewer is open
    document.body.style.overflow = 'hidden';
  }

  // Close image viewer
  closeImageViewer() {
    this.showImageViewer = false;
    this.fullImageUrl = '';
    
    // Restore body scrolling
    document.body.style.overflow = '';
  }


  ionViewWillLeave() {
    // Unsubscribe when leaving the page
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
    
    // Reset image viewer if it was open
    if (this.showImageViewer) {
      this.closeImageViewer();
    }
  }

  ngOnDestroy() {
    // Unsubscribe from messages
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
    
    // Reset image viewer if it was open
    if (this.showImageViewer) {
      this.closeImageViewer();
    }
  }
}