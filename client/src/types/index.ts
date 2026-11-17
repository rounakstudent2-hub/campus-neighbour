export type UserRole = 'neighbor' | 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  is_verified: number;
  is_active: number;
  created_at?: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  bio?: string;
  college_name?: string;
  education_level?: string;
  skills: string[];
  working_radius_km: number;
  is_guardian_approved: number;
  is_available: number;
  total_tasks_completed: number;
  total_earnings: number;
  average_rating: number;
  ratings_count: number;
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  bio?: string;
  default_address?: string;
  total_tasks_posted: number;
}

export interface TaskCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: number;
  task_count?: number;
}

export type TaskStatus = 'Open' | 'Applied' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled' | 'Disputed';

export interface Task {
  id: string;
  customer_id: string;
  category_id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  address: string;
  locality: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  status: TaskStatus;
  assigned_student_id?: string;
  completion_proof?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  category_name?: string;
  category_icon?: string;
  customer_name?: string;
  customer_avatar?: string;
  customer_phone?: string;
  customer_locality?: string;
  customer_address?: string;
  assigned_student_name?: string;
  assigned_student_avatar?: string;
  assigned_student_phone?: string;
  applications_count?: number;
  distance_km?: number | null;
}

export type ApplicationStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';

export interface Application {
  id: string;
  task_id: string;
  student_id: string;
  proposed_fee: number;
  pitch_note?: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  student_name?: string;
  student_avatar?: string;
  student_locality?: string;
  college_name?: string;
  education_level?: string;
  skills?: string[];
  average_rating?: number;
  ratings_count?: number;
  total_tasks_completed?: number;
  task_title?: string;
  task_budget?: number;
  task_deadline?: string;
  task_status?: TaskStatus;
  task_locality?: string;
  category_name?: string;
  customer_name?: string;
}

export interface Conversation {
  id: string;
  taskId: string;
  taskTitle: string;
  taskStatus: TaskStatus;
  taskBudget: number;
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  message_text: string;
  is_read: number;
  created_at: string;
}

export interface Payment {
  id: string;
  task_id: string;
  customer_id: string;
  student_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'escrow_held' | 'released' | 'refunded' | 'failed';
  payment_gateway: string;
  gateway_order_id?: string;
  gateway_payment_id?: string;
  transaction_type: string;
  created_at: string;
  task_title?: string;
  customer_name?: string;
  student_name?: string;
}

export interface Review {
  id: string;
  task_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
  task_title?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link_url?: string;
  is_read: number;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  task_id?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  admin_notes?: string;
  created_at: string;
  resolved_at?: string;
  reporter_name?: string;
  reported_user_name?: string;
  task_title?: string;
}
