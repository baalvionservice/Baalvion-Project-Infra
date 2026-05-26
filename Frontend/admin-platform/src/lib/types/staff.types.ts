export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export interface Department {
  id:          string;
  name:        string;
  headId:      string | null;
  headName:    string | null;
  parentId:    string | null;
  memberCount: number;
  createdAt:   string;
}

export interface Team {
  id:          string;
  name:        string;
  departmentId: string;
  leadId:      string | null;
  leadName:    string | null;
  memberCount: number;
  projects:    string[];
  createdAt:   string;
}

export interface Employee {
  id:           string;
  userId:       string;
  email:        string;
  fullName:     string;
  avatarUrl:    string | null;
  title:        string;
  departmentId: string;
  departmentName: string;
  teamId:       string | null;
  teamName:     string | null;
  managerId:    string | null;
  managerName:  string | null;
  status:       EmployeeStatus;
  role:         string;
  permissions:  string[];
  location:     string | null;
  timezone:     string;
  hiredAt:      string;
  lastActiveAt: string;
  createdAt:    string;
}

export interface StaffInvitation {
  id:         string;
  email:      string;
  role:       string;
  department: string;
  invitedBy:  string;
  expiresAt:  string;
  acceptedAt: string | null;
  status:     'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt:  string;
}

export interface OnboardingChecklist {
  employeeId: string;
  steps: Array<{
    id:          string;
    title:       string;
    description: string;
    completed:   boolean;
    completedAt: string | null;
    dueDate:     string | null;
  }>;
  completionPct: number;
}
