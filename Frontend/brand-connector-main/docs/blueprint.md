# **App Name**: Baalvion Connect

## Core Features:

- User Role Onboarding & Profiles: Enable creators and brands to register, set up distinct profiles with relevant details like niches, portfolios for creators, and brand guidelines for brands. These profiles are stored securely in Firestore.
- Brand Campaign Creation: Allow brands to create and list new campaigns, specifying objectives, detailed requirements, and expected deliverables. Campaigns are persisted in Firestore.
- Creator Campaign Discovery & Application: Provide creators with an interface to browse, filter, and view available campaigns, and submit applications. Campaign data and applications are managed in Firestore.
- AI-Powered Matching Tool: Implement an AI tool to intelligently match suitable creators with brand campaigns, generating recommendations based on compatibility metrics derived from user profiles and campaign requirements.
- Deliverable Management Workflow: Facilitate creators in submitting campaign deliverables and allow brands to review, provide feedback, and approve/request revisions. Deliverable statuses are updated in Firestore.
- Secure Wallet & Transaction System: Manage user wallets, process payments from brands to the platform, apply platform fees, and handle payouts to creators through secure transactions stored in Firestore.
- In-App Notification Hub: Display real-time notifications to users regarding application status updates, campaign changes, payment alerts, and deliverable feedback, managed via Firestore.
- Firestore Data Management & Security: Establish Firestore collections with robust security rules and typed CRUD helpers for managing user, creator, brand, campaign, application, deliverable, wallet, transaction, dispute, and notification data.
- Firebase Authentication & Role Management: Implement Firebase Authentication supporting Email/Password, Google OAuth, and phone number verification, with helper functions for auth actions and initial role assignment upon signup.
- Global Authentication Context: Provide a global AuthContext for the application, managing current user, role, profile, and loading state using useReducer and persisting state via Firebase's onAuthStateChanged.
- Mock Data Seeding for Development: Generate realistic mock data for brands, creators, campaigns, and transactions, with a seedFirestore() function for populating development environments.
- Responsive Global Layout & Navigation: Implement a responsive root layout including a Navbar with public and role-based menu items, a Sidebar for dashboard navigation, and a Footer, utilizing Headless UI components.

## Style Guidelines:

- Primary color: A vibrant purple (#6C3AE8) evoking creativity, modernity, and a premium feel. It provides strong contrast for interactive elements on light backgrounds.
- Accent color: A striking orange (#F97316) for calls-to-action, highlights, and secondary interactive elements, ensuring high visibility and energy.
- Background color: A clean, very light grey-blue (#F9FAFB) that establishes a professional and spacious canvas, promoting readability and focus in a light color scheme.
- Headline font: 'Plus Jakarta Sans', a modern geometric sans-serif that lends a contemporary and bold aesthetic to titles and headings.
- Body font: 'Inter', a highly readable and versatile sans-serif, ensuring optimal legibility for all body text, paragraphs, and functional UI elements.
- Utilize clean, sharp, and minimalist vector icons that align with the app's modern and professional aesthetic, clearly communicating actions and statuses.
- Adopt a grid-based, spacious layout with ample whitespace to ensure a professional, uncluttered, and easily navigable user interface across all screen sizes.
- Implement subtle and purposeful animations for state changes, feedback, and transitions, enhancing user engagement without being distracting.