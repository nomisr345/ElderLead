import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Community } from '../../models/community.model';

@Component({
  selector: 'app-community-card',
  templateUrl: './community-card.component.html',
  styleUrls: ['./community-card.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule]
})
export class CommunityCardComponent {
  @Input() community!: Community;
  @Input() userRole?: string;
  @Output() joinClicked = new EventEmitter<string>();
  @Output() leaveClicked = new EventEmitter<string>();
  @Output() viewDetailsClicked = new EventEmitter<string>();

  constructor() {}

  onJoin(event: Event): void {
    event.stopPropagation();
    this.joinClicked.emit(this.community.communityId);
  }

  onLeave(event: Event): void {
    event.stopPropagation();
    this.leaveClicked.emit(this.community.communityId);
  }

  onViewDetails(): void {
    this.viewDetailsClicked.emit(this.community.communityId);
  }

  // Truncate description if too long
  truncateDescription(description: string, maxLength: number = 100): string {
    if (description.length <= maxLength) {
      return description;
    }
    return description.substring(0, maxLength) + '...';
  }

  // Get formatted date
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

  // Get the default image if none is provided
  getImageUrl(): string {
    return this.community.imageUrl || 'assets/green_park.jpg';
  }
}