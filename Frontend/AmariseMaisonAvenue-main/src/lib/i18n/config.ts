/**
 * @fileOverview Institutional Localization Configuration
 */

export type SupportedLanguage = 'en' | 'ar' | 'hi' | 'fr';

export interface LocalizationConfig {
  defaultLanguage: SupportedLanguage;
  fallbackLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
  translations: Record<SupportedLanguage, Record<string, string>>;
}

export const I18N_CONFIG: LocalizationConfig = {
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  supportedLanguages: ['en', 'ar', 'hi', 'fr'],
  translations: {
    en: {
      'nav.home': 'Home',
      'nav.archive': 'Registry',
      'nav.curation': 'Curation',
      'nav.search': 'Search',
      'product.inquire': 'Inquire Privately',
      'product.add_to_bag': 'Add to Shopping Bag',
      'product.provenance': 'Provenance Verified',
      'footer.charter': 'Founding Charter 1924',
      'common.search': 'Search Registry...',
      'common.hub': 'Market Hub',
      'common.login': 'Log in | Sign up'
    },
    ar: {
      'nav.home': 'الرئيسية',
      'nav.archive': 'السجل',
      'nav.curation': 'تقييم',
      'nav.intelligence': 'ذكاء',
      'product.inquire': 'استفسار خاص',
      'product.add_to_bag': 'أضف إلى حقيبة التسوق',
      'product.provenance': 'تم التحقق من المصدر',
      'footer.charter': 'ميثاق التأسيس ١٩٢٤',
      'common.search': 'البحث في السجل...',
      'common.hub': 'مركز السوق',
      'common.login': 'تسجيل الدخول | تسجيل'
    },
    hi: {
      'nav.home': 'होम',
      'nav.archive': 'रजिस्ट्री',
      'nav.curation': 'क्यूरेशन',
      'nav.intelligence': 'इंटेलिजेंस',
      'product.inquire': 'निजी तौर पर पूछताछ करें',
      'product.add_to_bag': 'शॉपिंग बैग में जोड़ें',
      'product.provenance': 'स्रोत सत्यापित',
      'footer.charter': 'स्थापना चार्टर १९२४',
      'common.search': 'रजिस्ट्री खोजें...',
      'common.hub': 'मार्केट हब',
      'common.login': 'लॉग इन करें | साइन अप'
    },
    fr: {
      'nav.home': 'Accueil',
      'nav.archive': 'Registre',
      'nav.curation': 'Curation',
      'nav.intelligence': 'Intelligence',
      'product.inquire': 'S’informer en privé',
      'product.add_to_bag': 'Ajouter au panier',
      'product.provenance': 'Provenance vérifiée',
      'footer.charter': 'Charte de Fondation 1924',
      'common.search': 'Rechercher dans le registre...',
      'common.hub': 'Centre de Marché',
      'common.login': 'Connexion | Inscription'
    }
  }
};
