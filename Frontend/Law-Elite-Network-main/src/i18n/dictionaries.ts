// Lightweight i18n dictionaries for the global directory. English is the source;
// other locales cover the highest-visibility shared UI (nav, hero, common CTAs).
// Extend per-page strings incrementally — missing keys fall back to English.

export type Locale = "en" | "es" | "fr" | "hi" | "ar";

export const LOCALES: { code: Locale; label: string; rtl?: boolean }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "hi", label: "हिन्दी" },
  { code: "ar", label: "العربية", rtl: true },
];

export const RTL_LOCALES: Locale[] = ["ar"];

type Dict = Record<string, string>;

export const dictionaries: Record<Locale, Dict> = {
  en: {
    "nav.findLawyers": "Find Lawyers",
    "nav.knowledge": "Legal Knowledge",
    "nav.plans": "Plans",
    "nav.signIn": "Sign in",
    "nav.dashboard": "Dashboard",
    "nav.getStarted": "Get started",
    "common.search": "Search",
    "common.loading": "Loading…",
    "hero.title": "Find the right lawyer, anywhere in the world",
    "hero.subtitle": "Vetted legal experts across 188 countries. Book consultations, manage matters, get answers.",
    "hero.cta": "Find a lawyer",
    "hero.searchPlaceholder": "Search by name, practice area or country…",
  },
  es: {
    "nav.findLawyers": "Buscar Abogados",
    "nav.knowledge": "Conocimiento Legal",
    "nav.plans": "Planes",
    "nav.signIn": "Iniciar sesión",
    "nav.dashboard": "Panel",
    "nav.getStarted": "Empezar",
    "common.search": "Buscar",
    "common.loading": "Cargando…",
    "hero.title": "Encuentra el abogado adecuado, en cualquier parte del mundo",
    "hero.subtitle": "Expertos legales verificados en 188 países. Reserva consultas, gestiona casos, obtén respuestas.",
    "hero.cta": "Buscar un abogado",
    "hero.searchPlaceholder": "Busca por nombre, área de práctica o país…",
  },
  fr: {
    "nav.findLawyers": "Trouver des Avocats",
    "nav.knowledge": "Savoir Juridique",
    "nav.plans": "Forfaits",
    "nav.signIn": "Se connecter",
    "nav.dashboard": "Tableau de bord",
    "nav.getStarted": "Commencer",
    "common.search": "Rechercher",
    "common.loading": "Chargement…",
    "hero.title": "Trouvez le bon avocat, partout dans le monde",
    "hero.subtitle": "Experts juridiques vérifiés dans 188 pays. Réservez des consultations, gérez vos dossiers.",
    "hero.cta": "Trouver un avocat",
    "hero.searchPlaceholder": "Recherchez par nom, domaine ou pays…",
  },
  hi: {
    "nav.findLawyers": "वकील खोजें",
    "nav.knowledge": "कानूनी ज्ञान",
    "nav.plans": "योजनाएँ",
    "nav.signIn": "साइन इन करें",
    "nav.dashboard": "डैशबोर्ड",
    "nav.getStarted": "शुरू करें",
    "common.search": "खोजें",
    "common.loading": "लोड हो रहा है…",
    "hero.title": "दुनिया में कहीं भी सही वकील खोजें",
    "hero.subtitle": "188 देशों में सत्यापित कानूनी विशेषज्ञ। परामर्श बुक करें, मामले प्रबंधित करें।",
    "hero.cta": "वकील खोजें",
    "hero.searchPlaceholder": "नाम, अभ्यास क्षेत्र या देश से खोजें…",
  },
  ar: {
    "nav.findLawyers": "ابحث عن محامين",
    "nav.knowledge": "المعرفة القانونية",
    "nav.plans": "الخطط",
    "nav.signIn": "تسجيل الدخول",
    "nav.dashboard": "لوحة التحكم",
    "nav.getStarted": "ابدأ",
    "common.search": "بحث",
    "common.loading": "جار التحميل…",
    "hero.title": "اعثر على المحامي المناسب في أي مكان في العالم",
    "hero.subtitle": "خبراء قانونيون موثوقون في 188 دولة. احجز الاستشارات وأدر القضايا.",
    "hero.cta": "ابحث عن محامٍ",
    "hero.searchPlaceholder": "ابحث بالاسم أو مجال الممارسة أو الدولة…",
  },
};
