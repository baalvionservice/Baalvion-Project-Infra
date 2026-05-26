
export interface OnboardingState {
  userId: string;
  currentStep: number;
  completed: boolean;
  companyName: string;
  industry: string;
  goals: string[];
  preferredPlatforms: string[];
  budgetRange: string;
}

export type OnboardingGoal = 'AWARENESS' | 'SALES' | 'INSTALLS' | 'ENGAGEMENT';

export const ONBOARDING_GOALS: { id: OnboardingGoal; label: string; description: string }[] = [
  { id: 'AWARENESS', label: 'Brand Awareness', description: 'Reach as many potential customers as possible.' },
  { id: 'SALES', label: 'Direct Sales', description: 'Drive traffic to your shop and increase revenue.' },
  { id: 'INSTALLS', label: 'App Installs', description: 'Get more users to download and try your mobile app.' },
  { id: 'ENGAGEMENT', label: 'Social Engagement', description: 'Boost likes, comments, and community interaction.' },
];
