import { redirect } from 'next/navigation';

// The onboarding steps render inside the wizard at /company/onboarding.
// /steps has no standalone page — redirect into the wizard.
export default function OnboardingStepsIndex() {
  redirect('/company/onboarding');
}
