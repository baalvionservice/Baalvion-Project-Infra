/**
 * @fileOverview Network Translation Dictionary
 * Orchestrates multi-lingual support for the Law Elite Network.
 */

export type TranslationKeys = typeof translations.en;

export const translations: any = {
  en: {
    nav: {
      dashboard: "Dashboard",
      findCounsel: "Find Counsel",
      scheduling: "Scheduling",
      chambers: "Chambers",
      signIn: "Sign In",
      joinElite: "Join Elite",
      profile: "Executive Profile",
      logout: "Terminate Session",
    },
    search: {
      placeholder: "Search by name, expertise, or jurisdiction...",
      button: "Discovery",
      suggestions: "Network Intelligence Suggestions",
    },
    discovery: {
      title: "Discover Elite Counsel",
      subtitle: "Access a curated network of the world's most distinguished, verified legal practitioners.",
      filters: "Discovery Refinement",
      reset: "Reset Filters",
      apply: "Apply Intelligence Filters",
    },
    common: {
      book: "Book Now",
      reviews: "Reviews",
      verified: "Verified",
      available: "Available Now",
      inChambers: "In Chambers",
      loading: "Synchronizing...",
    }
  },
  hi: {
    nav: {
      dashboard: "डैशबोर्ड",
      findCounsel: "वकील खोजें",
      scheduling: "शेड्यूलिंग",
      chambers: "चेम्बर्स",
      signIn: "साइन इन करें",
      joinElite: "एलीट से जुड़ें",
      profile: "कार्यकारी प्रोफ़ाइल",
      logout: "सत्र समाप्त करें",
    },
    search: {
      placeholder: "नाम, विशेषज्ञता या अधिकार क्षेत्र से खोजें...",
      button: "खोज",
      suggestions: "नेटवर्क इंटेलिजेंस सुझाव",
    },
    discovery: {
      title: "एलीट वकील खोजें",
      subtitle: "दुनिया के सबसे प्रतिष्ठित, सत्यापित कानूनी चिकित्सकों के क्यूरेटेड नेटवर्क तक पहुंचें।",
      filters: "खोज शोधन",
      reset: "फिल्टर रीसेट करें",
      apply: "इंटेलिजेंस फिल्टर लागू करें",
    },
    common: {
      book: "अभी बुक करें",
      reviews: "समीक्षाएं",
      verified: "सत्यापित",
      available: "अभी उपलब्ध",
      inChambers: "चेम्बर्स में",
      loading: "सिंक्रनाइज़ हो रहा है...",
    }
  },
};
