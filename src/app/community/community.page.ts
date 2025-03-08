import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommunityService } from '../services/community.service';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import * as firebaseApp from 'firebase/app';

@Component({
  selector: 'app-community',
  templateUrl: './community.page.html',
  styleUrls: ['./community.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CommunityPage implements OnInit {
  communities: any[] = [];
  filteredCommunities: any[] = [];
  searchTerm: string = '';
  filterOption: string = 'all';
  isLoading: boolean = true;
  currentUserId: string | null = null;
  private db = getFirestore(firebaseApp.getApp());

  constructor(
    private authService: AuthService,
    private communityService: CommunityService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.isLoading = true;
    console.log('Community page initialized');
    
    try {
      // Get current user
      const user = await this.authService.getCurrentUser();
      this.currentUserId = user ? user.uid : null;
      console.log('Current user:', this.currentUserId);
      
      // Load communities directly from Firestore
      await this.loadCommunities();
    } catch (error) {
      console.error('Error in ngOnInit:', error);
      this.isLoading = false;
    }
  }

  ionViewWillEnter() {
    // Refresh communities when view is entered
    this.loadCommunities();
  }

  // Pull to refresh implementation
  async refresh(event: any) {
    console.log('Begin refresh operation');
    
    try {
      // Get current user
      const user = await this.authService.getCurrentUser();
      this.currentUserId = user ? user.uid : null;
      console.log('Current user (refresh):', this.currentUserId);
      
      // Load fresh communities data
      await this.loadCommunities(false); // Pass false to not set isLoading to true
      
      // Complete the refresh
      event.target.complete();
      console.log('Refresh completed successfully');
    } catch (error) {
      console.error('Error during refresh:', error);
      event.target.complete();
    }
  }

  async loadCommunities(showLoadingIndicator: boolean = true) {
    if (showLoadingIndicator) {
      this.isLoading = true;
    }
    console.log('Loading communities...');
    
    try {
      // Get all communities
      const communitiesRef = collection(this.db, 'communities');
      const communitiesSnapshot = await getDocs(query(communitiesRef, orderBy('createdAt', 'desc')));
      const allCommunities = communitiesSnapshot.docs.map(doc => doc.data());
      console.log('Fetched communities:', allCommunities.length);
      
      // If user is logged in, get their memberships
      if (this.currentUserId) {
        const membersRef = collection(this.db, 'communityMembers');
        const membershipQuery = query(membersRef, where('userId', '==', this.currentUserId));
        const membershipsSnapshot = await getDocs(membershipQuery);
        
        const userMemberships = membershipsSnapshot.docs.map(doc => doc.data());
        console.log('Fetched user memberships:', userMemberships.length);
        
        // Merge communities with membership data
        this.communities = allCommunities.map(community => {
          const membership = userMemberships.find(m => m['communityId'] === community['communityId']);
          return {
            ...community,
            role: membership ? membership['role'] : null
          };
        });
      } else {
        // If not logged in, just show all communities without role
        this.communities = allCommunities.map(community => ({
          ...community,
          role: null
        }));
      }
      
      this.applyFilters();
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading communities:', error);
      this.communities = [];
      this.filteredCommunities = [];
      this.isLoading = false;
    }
  }

  // Apply search and filters
  applyFilters() {
    let result = [...this.communities];
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      result = result.filter(community => {
        const nameMatch = community['name'] && community['name'].toLowerCase().includes(searchLower);
        const communityNameMatch = community['communityName'] && community['communityName'].toLowerCase().includes(searchLower);
        const shortDescMatch = community['short_description'] && community['short_description'].toLowerCase().includes(searchLower);
        const longDescMatch = community['long_description'] && community['long_description'].toLowerCase().includes(searchLower);
        
        return nameMatch || communityNameMatch || shortDescMatch || longDescMatch;
      });
    }
    
    // Apply category filter
    if (this.filterOption === 'my') {
      result = result.filter(community => community['role'] !== null);
      console.log('My communities filter applied, showing:', result.length, 'communities');
    } else if (this.filterOption === 'public') {
      result = result.filter(community => community['isPublic']);
      console.log('Public filter applied, showing:', result.length, 'communities');
    } else {
      console.log('All filter applied, showing:', result.length, 'communities');
    }
    
    this.filteredCommunities = result;
  }

  // Dynamic search handler using ionInput
  onSearchInput(event: any) {
    this.searchTerm = event.target.value || '';
    this.applyFilters();
  }

  // Filter change handler
  onFilterChange() {
    this.applyFilters();
  }

  // Navigate to community setup
  goToCreateCommunity() {
    console.log('Create community button clicked');
    this.router.navigate(['/community-setup']);
  }

  // Join a community - just navigate to details page for now
  async joinCommunity(communityId: string) {
    this.router.navigate(['/community-details', communityId]);
  }

  // Leave a community - just navigate to details page for now
  async leaveCommunity(communityId: string) {
    this.router.navigate(['/community-details', communityId]);
  }

  // Navigate to community details
  async viewCommunityDetails(communityId: string) {
    // Make sure user is authenticated first
    const user = await this.authService.getCurrentUser();
    if (user) {
      console.log('Navigating to community details:', communityId);
      this.router.navigate(['/community-details', communityId]);
    } else {
      // User not authenticated, redirect to login
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: `/community-details/${communityId}` } 
      });
    }
  }
}