import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Learn how ControlTheMarket collects, uses, and protects your personal information. Your privacy is important to us.',
  alternates: {
    canonical: 'https://controlthemarket.com/privacy',
  },
};

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "1. Introduction",
      content: "Welcome to SkillMatch Pro. We are committed to protecting your privacy and handling your data in an open and transparent manner. This privacy policy sets out how we collect, use, and protect your personal information."
    },
    {
      title: "2. Information We Collect",
      content: "We may collect the following types of information: Personal Identification Information (Name, email address, phone number, etc.), Professional Information (Resume, work history, skills), and Technical Data (IP address, browser type, usage data)."
    },
    {
      title: "3. How We Use Your Information",
      content: "Your information is used to provide and improve our services, to facilitate the hiring process between candidates and companies, for billing and account management, and to communicate with you about our platform."
    },
    {
      title: "4. Data Sharing and Disclosure",
      content: "We may share your information with companies on the platform for hiring purposes, with third-party service providers who assist us in our operations, or when required by law. We do not sell your personal data."
    },
    {
      title: "5. Data Security",
      content: "We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet is 100% secure."
    },
    {
      title: "6. Your Data Rights",
      content: "You have the right to access, correct, or request deletion of your personal data. Please contact us to make such a request."
    },
    {
      title: "7. Cookies",
      content: "We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. You can control the use of cookies at the individual browser level."
    },
    {
      title: "8. Changes to This Policy",
      content: "We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page. Last updated: July 2024."
    }
  ];

  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your privacy is important to us. Here's how we handle your data.
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
