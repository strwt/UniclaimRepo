export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNum: string;
  studentId: string;
  createdAt?: any;
  updatedAt?: any;
}

// Re-export UserData from firebase utils for consistency
export type { UserData } from '../utils/firebase';
