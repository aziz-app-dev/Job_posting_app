import firebase from "firebase/compat/app";

// ─────────────────────────────────────────────────
// Visibility & Privacy Types
// ─────────────────────────────────────────────────
export type PostVisibility = "Public" | "Followers only" | "Private";

// ─────────────────────────────────────────────────
// Job Types
// ─────────────────────────────────────────────────
export type JobType = "Full-time" | "Part-time" | "Contract" | "Freelance" | "Internship" | "Remote";
export type ExperienceLevel = "Entry" | "Mid" | "Senior" | "Lead" | "Executive";

export interface JobPreferences {
  openToWork: boolean;
  skills: string[];
  desiredJobTypes: JobType[];
  desiredLocations: string[];
  experienceLevel: ExperienceLevel;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  salaryCurrency?: string;
}

// ─────────────────────────────────────────────────
// Post Types
// ─────────────────────────────────────────────────
export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorTitle: string;

  caption: string;
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  thumbnailUrl: string | null;

  title: string;
  url: string;
  location: string;
  topics: string[];

  visibility: PostVisibility;
  commentsEnabled: boolean;

  // Job-specific fields
  isJobPost: boolean;
  jobType?: JobType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  companyName?: string;
  requirements?: string[];
  experienceLevel?: ExperienceLevel;
  applicationUrl?: string;
  applicationDeadline?: Date;

  likesCount: number;
  commentsCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostInput {
  caption: string;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | null;
  thumbnailUrl?: string | null;
  title?: string;
  url?: string;
  location?: string;
  topics?: string[];
  visibility?: PostVisibility;
  commentsEnabled?: boolean;
  // Job-specific fields
  isJobPost?: boolean;
  jobType?: JobType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  companyName?: string;
  requirements?: string[];
  experienceLevel?: ExperienceLevel;
  applicationUrl?: string;
  applicationDeadline?: Date;
}

// ─────────────────────────────────────────────────
// Draft Types
// ─────────────────────────────────────────────────
export interface Draft {
  id: string;
  authorId: string;

  caption: string;
  localMediaUri: string | null;
  mediaType: "image" | "video" | null;

  title: string;
  url: string;
  location: string;
  topics: string[];

  visibility: PostVisibility;
  commentsEnabled: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDraftInput {
  caption?: string;
  localMediaUri?: string | null;
  mediaType?: "image" | "video" | null;
  title?: string;
  url?: string;
  location?: string;
  topics?: string[];
  visibility?: PostVisibility;
  commentsEnabled?: boolean;
}

// ─────────────────────────────────────────────────
// Comment Types
// ─────────────────────────────────────────────────
export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorTitle: string;

  text: string;
  likesCount: number;
  parentId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentInput {
  text: string;
  parentId?: string | null;
}

// ─────────────────────────────────────────────────
// Follow Types
// ─────────────────────────────────────────────────
export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

// ─────────────────────────────────────────────────
// Block Types
// ─────────────────────────────────────────────────
export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

// ─────────────────────────────────────────────────
// Like Types
// ─────────────────────────────────────────────────
export interface Like {
  userId: string;
  createdAt: Date;
}

// ─────────────────────────────────────────────────
// Notification Types
// ─────────────────────────────────────────────────
export type NotificationType = "like" | "comment" | "follow" | "reply" | "job_match" | "job_application" | "status_update" | "message";

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: NotificationType;
  postId?: string;
  postThumbnail?: string;
  commentId?: string;
  commentText?: string;
  // Job match specific fields
  jobTitle?: string;
  companyName?: string;
  matchReason?: string;
  // Job application specific fields
  applicationId?: string;
  applicantMessage?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface CreateNotificationInput {
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: NotificationType;
  postId?: string;
  postThumbnail?: string;
  commentId?: string;
  commentText?: string;
  // Job match specific fields
  jobTitle?: string;
  companyName?: string;
  matchReason?: string;
  // Job application specific fields
  applicationId?: string;
  applicantMessage?: string;
}

// ─────────────────────────────────────────────────
// Job Application Types
// ─────────────────────────────────────────────────
export type ApplicationStatus = "applied" | "viewed" | "shortlisted" | "rejected" | "hired";

export const APPLICATION_STATUS_FLOW: ApplicationStatus[] = [
  "applied", "viewed", "shortlisted", "hired"
];

export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; icon: string }> = {
  applied: { label: "Applied", color: "#007AFF", icon: "send" },
  viewed: { label: "Viewed", color: "#FF9500", icon: "eye" },
  shortlisted: { label: "Shortlisted", color: "#22C55E", icon: "star" },
  rejected: { label: "Rejected", color: "#FF3B30", icon: "x-circle" },
  hired: { label: "Hired", color: "#34C759", icon: "check-circle" },
};

export interface JobApplication {
  id: string;
  postId: string;
  jobTitle: string;
  companyName: string;
  applicantId: string;
  applicantName: string;
  applicantAvatar: string;
  applicantTitle: string;
  applicantEmail?: string;
  recruiterId: string;
  message?: string;
  resumeUrl?: string;
  status: ApplicationStatus;
  statusHistory: { status: ApplicationStatus; timestamp: Date; note?: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApplicationInput {
  postId: string;
  jobTitle: string;
  companyName: string;
  recruiterId: string;
  message?: string;
  resumeUrl?: string;
}

// ─────────────────────────────────────────────────
// Collection (Bookmark) Types
// ─────────────────────────────────────────────────
export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string;
  postIds: string[];
  coverImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCollectionInput {
  name: string;
  description?: string;
}

// ─────────────────────────────────────────────────
// Toast Types
// ─────────────────────────────────────────────────
export type ToastType = "progress" | "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  progress?: number;
  dismissible?: boolean;
  duration?: number;
}

// ─────────────────────────────────────────────────
// Service Response Types
// ─────────────────────────────────────────────────
export interface ServiceResponse<T = void> {
  data?: T;
  error: string | null;
}

export interface PostServiceResponse {
  postId?: string;
  error: string | null;
}

export interface DraftServiceResponse {
  draftId?: string;
  error: string | null;
}

// ─────────────────────────────────────────────────
// Messaging Types
// ─────────────────────────────────────────────────
export interface Conversation {
  id: string;
  participantIds: string[];
  participants: {
    [uid: string]: {
      name: string;
      avatar: string;
      title: string;
    };
  };
  lastMessage: string;
  lastMessageAt: Date;
  lastSenderId: string;
  unreadCount: { [uid: string]: number };
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  imageUrl?: string;
  readBy: string[];
  createdAt: Date;
}

// ─────────────────────────────────────────────────
// Company Types
// ─────────────────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  logo: string;
  coverImage: string;
  description: string;
  industry: string;
  location: string;
  website: string;
  size: string;
  ownerId: string;
  adminIds: string[];
  followersCount: number;
  postsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompanyInput {
  name: string;
  description?: string;
  industry?: string;
  location?: string;
  website?: string;
  size?: string;
}

// ─────────────────────────────────────────────────
// Firestore Timestamp Conversion Helper
// ─────────────────────────────────────────────────
export const toDate = (
  timestamp: firebase.firestore.Timestamp | Date | null | undefined
): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};
