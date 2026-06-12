import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Review the Terms of Service for ControlTheMarket. By using our platform you agree to these terms governing candidate submissions and company hiring.',
  alternates: {
    canonical: absoluteUrl('/terms'),
  },
};

export default function TermsOfServicePage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing or using the SkillMatch Pro platform, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service."
    },
    {
      title: "2. Platform Usage",
      content: "You agree to use the platform only for its intended purpose. Candidates agree to submit their own original work. Companies agree to use the platform for legitimate hiring purposes and to evaluate candidates fairly."
    },
    {
      title: "3. Intellectual Property",
      content: "Candidates retain intellectual property rights to their submissions. By submitting work, you grant companies a license to review and evaluate your work for hiring purposes. You also grant SkillMatch Pro a license to host, display, and use the submission for platform operations."
    },
    {
      title: "4. User Conduct",
      content: "You agree not to engage in any activity that is fraudulent, abusive, or illegal. This includes, but is not limited to, plagiarism, misrepresentation of skills, or attempting to disrupt the service."
    },
    {
      title: "5. Limitation of Liability",
      content: "SkillMatch Pro is provided 'as is'. We make no warranties regarding the outcomes of the hiring process. Our liability is limited to the maximum extent permitted by law."
    },
    {
      title: "6. Termination",
      content: "We may terminate or suspend your access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms."
    },
    {
      title: "7. Governing Law",
      content: "These Terms shall be governed and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions."
    },
    {
      title: "8. Changes to Terms",
      content: "We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes. Last updated: July 2024."
    }
  ];

  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Please read these terms carefully before using our platform.
          </p>
        </div>

        <div className="mt-12 space-y-8 prose prose-lg max-w-none">
          {sections.map(section => (
            <div key={section.title}>
              <h2 className="font-headline text-2xl font-bold">{section.title}</h2>
              <p className="text-muted-foreground">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
