import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { CommunityMessage } from '../../models/community.model';

@Component({
  selector: 'app-message-item',
  templateUrl: './message-item.component.html',
  styleUrls: ['./message-item.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MessageItemComponent {
  @Input() message!: CommunityMessage;
  @Input() currentUserId!: string;
  @Input() userRole?: string;
  @Output() deleteMessage = new EventEmitter<string>();

  constructor() {}

  // Format timestamp
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

  // Format date
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

  // Check if message is from current user
  isCurrentUser(): boolean {
    return this.message.senderId === this.currentUserId;
  }

  // Check if user can delete this message
  canDelete(): boolean {
    return this.isCurrentUser() || this.userRole === 'admin' || this.userRole === 'owner';
  }

  // Get default avatar if none provided
  getAvatar(): string {
    return this.message.senderPhotoURL || 'assets/default-avatar.png';
  }

  // Handle message deletion
  onDelete(): void {
    this.deleteMessage.emit(this.message.messageId);
  }

  // Get file size in readable format
  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if file is an image
  isImageFile(): boolean {
    if (!this.message.fileName) return false;
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const fileName = this.message.fileName.toLowerCase();
    
    return imageExtensions.some(ext => fileName.endsWith(ext));
  }
}