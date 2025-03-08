export interface Community {
  communityId: string;
  name: string;
  communityName: string;
  short_description: string;
  long_description: string;
  imageUrl: string;
  createdAt: any; // firebase.firestore.FieldValue.serverTimestamp()
  createdByUserId: string;
  memberCount: number;
  isPublic: boolean;
  updatedAt?: any;
}

export interface CommunityMember {
  communityId: string;
  userId: string;
  role: string; // 'owner', 'admin', 'member'
  joinedAt: any; // firebase.firestore.FieldValue.serverTimestamp()
}

export interface CommunityMessage {
  communityId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string;
  content: string;
  timestamp: any; // firebase.firestore.FieldValue.serverTimestamp()
  type: string; // 'text', 'image', 'file'
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}