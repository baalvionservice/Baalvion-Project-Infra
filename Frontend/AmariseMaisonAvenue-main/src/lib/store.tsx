"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { getProducts, getCollections } from "./catalog";
import { getMarkets } from "./markets";
import {
  Product,
  CountryCode,
  Transaction,
  CountryConfig,
  BrandConfig,
  GlobalSyncSession,
  MaisonNotification,
  GlobalSettings,
  AdminViewMode,
  TransactionStatus,
  CartItem,
  VipClient,
  SupportTicket,
  MaisonMetric,
  MaisonAlert,
  SystemHealthScore,
  FraudLog,
  DynamicPrice,
  CMSSection,
  Collection,
  Editorial,
  SEOMetadata,
  Appointment,
  Invoice,
  Affiliate,
  ReturnRequest,
  MaisonError,
  BrandIntegrityIssue,
  WorkflowTask,
  AIModuleStatus,
  AIActionLog,
  AISuggestion,
  Department,
  Category,
  BackgroundJob,
  AuditLogEntry,
  Shipment,
  PaymentPlan,
  Subscription,
  FXRate,
  TaxRule,
  Campaign,
  BuyingGuide,
  AutomationRule,
} from "./types";
import {
  COUNTRIES as INITIAL_COUNTRIES,
  SUPPORT_TICKETS as INITIAL_TICKETS,
  INVOICES as INITIAL_INVOICES,
  EDITOR_INITIAL,
  BUYING_GUIDES,
  PAYMENT_PLANS,
  SUBSCRIPTIONS,
  FX_RATES,
} from "./mock-data";
import type { MaisonUser } from "./permissions/mock-users";
import { wishlistApi } from "./api-client";
import { getAccessToken } from "./auth";
import { COUNTRIES_CONFIG, BRANDS_CONFIG } from "./mock-global-config";
import { getMyVipClient, adjustMyWallet, createAppointment } from "./crm-client";
import { SupportedLanguage } from "./i18n/config";
import { eventBus } from "./events/bus";
import { initializeGlobalHandlers } from "./events/handlers";
import { workerEngine } from "./reliability/worker-engine";
import { obsEngine } from "./observability/engine";
import { DynamicPricingEngine } from "./ai-autopilot/dynamic-pricing-engine";

interface AppContextType {
  countryConfigs: CountryConfig[];
  brandConfigs: BrandConfig[];
  currentUser: MaisonUser | null;
  adminJurisdiction: CountryCode | "global";
  globalSyncHistory: GlobalSyncSession[];
  products: Product[];
  catalogSource: "backend" | "fallback";
  transactions: Transaction[];
  notifications: MaisonNotification[];
  globalSettings: GlobalSettings;
  cart: CartItem[];
  wishlist: Product[];
  isCartOpen: boolean;
  activeVip: VipClient | null;
  supportTickets: SupportTicket[];
  activeHub: CountryCode | "global";
  currentLanguage: SupportedLanguage;
  paymentPlans: PaymentPlan[];
  subscriptions: Subscription[];
  fxRates: FXRate[];

  // Scoped Data
  scopedProducts: Product[];
  scopedTransactions: Transaction[];
  scopedNotifications: MaisonNotification[];
  scopedErrors: MaisonError[];
  scopedAlerts: MaisonAlert[];
  scopedMetrics: MaisonMetric[];
  scopedCertificates: any[];
  scopedBrandIntegrity: BrandIntegrityIssue[];
  scopedWorkflows: WorkflowTask[];
  scopedShipments: Shipment[];
  scopedAuditLogs: AuditLogEntry[];
  scopedFraudLogs: FraudLog[];
  scopedPricingOptimizations: DynamicPrice[];
  scopedEvents: any[];
  scopedJobs: BackgroundJob[];

  // AI
  aiModules: AIModuleStatus[];
  aiLogs: AIActionLog[];
  aiSuggestions: AISuggestion[];

  // Settings
  integrations: any[];
  apiLogs: any[];
  systemHealth: SystemHealthScore;

  // Actions
  setCurrentUser: (user: MaisonUser | null) => void;
  setAdminJurisdiction: (jurisdiction: CountryCode | "global") => void;
  setCountryEnabled: (code: CountryCode, enabled: boolean) => void;
  updateGlobalSettings: (settings: GlobalSettings) => void;
  setAdminViewMode: (val: AdminViewMode) => void;
  executeSafeSync: (categories: any[], targets: CountryCode[]) => void;
  markNotificationRead: (id: string) => void;
  updateTransactionStatus: (id: string, status: TransactionStatus) => void;
  upsertProduct: (p: Product, reason?: string) => void;
  addToCart: (p: Product) => void;
  removeFromCart: (id: string) => void;
  /** Set an exact line quantity (clamped to >= 1); used by the cart quantity editor. */
  updateCartQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
  toggleWishlist: (p: Product) => void;
  topUpWallet: (amount: number) => void;
  requestLiveSession: (productId: string, productName: string) => boolean;
  createInvoice: (inv: Invoice) => void;
  createTransaction: (tx: Transaction) => void;
  deleteProduct: (id: string) => void;
  resolveAlert: (id: string) => void;
  resolveMaisonError: (id: string) => void;
  resolveBrandIntegrity: (id: string) => void;
  performWarehouseIntake: (
    productId: string,
    quantity: number,
    reason: string
  ) => void;
  recordMetric: (m: Omit<MaisonMetric, "id" | "timestamp">) => void;
  recordFraudLog: (l: Omit<FraudLog, "id">) => void;
  updateAIModule: (id: string, enabled: boolean, level: any) => void;
  addAILog: (log: AIActionLog) => void;
  upsertAISuggestion: (sug: AISuggestion) => void;
  updateSuggestionStatus: (id: string, status: any) => void;
  runWorkflowTask: (taskId: string) => void;
  runWorkflowSequence: (name: string, country?: string) => void;
  setLanguage: (l: SupportedLanguage) => void;
  optimizeRegistryPricing: (hub: CountryCode) => void;
  updateShipmentStatus: (id: string, status: any) => void;
  createShipment: (
    orderId: string,
    userId: string,
    country: CountryCode
  ) => void;
  upsertAppointment: (apt: Appointment) => void;
  upsertSEOMetadata: (meta: SEOMetadata) => void;
  toggleProductVipStatus: (id: string) => void;
  lockProductForEditing: (id: string) => boolean;
  trackShare: (id: string, country: string) => void;
  toggleLike: (id: string, country: string) => void;
  markAlertRead: (id: string) => void;
  updateInventory: (id: string, hub: CountryCode, adj: number) => void;
  refundTransaction: (id: string, reason: string) => void;
  toggleEmergencyMode: () => void;
  triggerReindex: (type: string) => void;
  upsertCampaign: (c: Campaign) => void;
  submitApproval: (id: string) => void;
  automationRules: AutomationRule[];
  toggleRule: (id: string) => void;
  upsertRule: (rule: AutomationRule) => void;
  cmsSections: CMSSection[];
  upsertCMSSection: (section: CMSSection) => void;
  upsertCollection: (collection: Collection) => void;
  upsertEditorial: (editorial: Editorial) => void;
  updateCountryConfig: (
    code: CountryCode,
    config: Partial<CountryConfig>
  ) => void;
  addTicketMessage: (id: string, text: string, sender: string) => void;
  updateTicketStatus: (id: string, status: any) => void;
  getLocalizedPrice: (price: number) => string;
  collections: Collection[];
  editorials: Editorial[];
  buyingGuides: BuyingGuide[];
  activeBrandId: string;
  setActiveBrand: (id: string) => void;
  seoRegistry: SEOMetadata[];
  socialMetrics: Record<string, any>;
  publishEvent: (type: any, source: any, payload: any) => void;
  recordLog: (
    action: string,
    entity: string,
    country: string,
    before?: any,
    after?: any,
    reason?: string
  ) => void;
  isShowcaseMode: boolean;
  setShowcaseMode: (val: boolean) => void;

  // Missing properties
  maisonErrors: MaisonError[];
  brandIntegrityIssues: BrandIntegrityIssue[];
  systemLogs: any[];
  warehouseLogs: any[];
  scopedQATests: any[];
  runQATest: (id: string) => void;
  runAllQATests: () => void;
  runStressTest: (id: string) => void;
  scopedStressTests: any[];
  scopedLiveRequests: any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Fail-closed: an anonymous visitor is nobody's staff persona, never a default
  // super_admin. Real customer identity comes from useAuth(); this only carries
  // an internal staff/VIP persona when something explicitly sets one.
  const [currentUser, setCurrentUser] = useState<MaisonUser | null>(null);
  const [adminJurisdiction, setAdminJurisdiction] = useState<
    CountryCode | "global"
  >("global");
  const [currentLanguage, setCurrentLanguage] =
    useState<SupportedLanguage>("en");
  const [activeBrandId, setActiveBrandId] = useState("amarise-luxe");
  const [isShowcaseMode, setShowcaseMode] = useState(true);

  // Catalog state is backend-driven (loaded from commerce-service in the effect below);
  // initial state is empty — no mock seed.
  const [products, setProducts] = useState<Product[]>([]);

  const [collections, setCollections] = useState<Collection[]>([]);
  // 'backend' ONLY when real backend products are loaded; 'fallback' = offline mock catalog.
  // Checkout is permitted only when 'backend' (see checkout) — never mix mock products with real orders.
  const [catalogSource, setCatalogSource] =
    useState<"backend" | "fallback">("fallback");

  // Storefront catalog is backend-driven: load published products + collections from
  // commerce-service (adapted to the rich app shapes). Backend is primary; the mock seeds
  // remain only as an offline fallback so the storefront still renders if the API is down.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Load the storefront catalog from the PUBLIC storefront API (anonymous-friendly) so
      // catalogSource becomes 'backend' and checkout is enabled for guest shoppers.
      const [prodPage, colls] = await Promise.all([
        getProducts({ limit: 100 }),
        getCollections(),
      ]);
      if (cancelled) return;
      if (prodPage.items.length) {
        setProducts(prodPage.items as Product[]);
        setCatalogSource("backend");
      } else {
        setCatalogSource("fallback");
        console.warn("[store] backend catalog empty; offline fallback active (checkout disabled)");
      }
      if (colls.length) setCollections(colls as Collection[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<MaisonNotification[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  // Real crm-service VIP record for the logged-in customer only (was a shared global mock
  // array where EVERY visitor saw the same first entry's wallet/certificates). null when
  // the customer isn't logged in or has no VIP record — never another customer's data.
  const [myVipClient, setMyVipClient] = useState<VipClient | null>(null);
  useEffect(() => {
    if (!getAccessToken()) return;
    getMyVipClient().then((v) => {
      if (v) setMyVipClient(v);
    });
  }, []);
  const [supportTickets, setSupportTickets] =
    useState<SupportTicket[]>(INITIAL_TICKETS);
  const [globalSyncHistory, setGlobalSyncHistory] = useState<
    GlobalSyncSession[]
  >([]);
  const [maisonErrors, setMaisonErrors] = useState<MaisonError[]>([]);
  const [alerts, setAlerts] = useState<MaisonAlert[]>([]);
  const [metrics, setMetrics] = useState<MaisonMetric[]>([]);
  const [fraudLogs, setFraudLogs] = useState<FraudLog[]>([]);
  const [pricingOptimizations, setPricingOptimizations] = useState<
    DynamicPrice[]
  >([]);
  const [brandIntegrityIssues, setBrandIntegrityIssues] = useState<
    BrandIntegrityIssue[]
  >([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [aiModules, setAiModules] = useState<AIModuleStatus[]>([
    {
      id: "ai-sales",
      name: "AI Sales Agent",
      enabled: true,
      level: "assisted",
    },
    {
      id: "ai-content",
      name: "Content Narrator",
      enabled: true,
      level: "auto",
    },
    {
      id: "ai-seo",
      name: "SEO Authority Optimizer",
      enabled: true,
      level: "assisted",
    },
    {
      id: "ai-pricing",
      name: "Neural Value Engine",
      enabled: true,
      level: "auto",
    },
    {
      id: "ai-fraud",
      name: "Heuristic Risk Shield",
      enabled: true,
      level: "auto",
    },
  ]);
  const [aiLogs, setAiLogs] = useState<AIActionLog[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [seoRegistry, setSeoRegistry] = useState<SEOMetadata[]>([]);
  const [socialMetrics, setSocialMetrics] = useState<Record<string, any>>({});
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [cmsSections, setCmsSections] = useState<CMSSection[]>([]);

  const [countryConfigs, setCountryConfigs] = useState<CountryConfig[]>(
    COUNTRIES_CONFIG.map((c) => ({
      ...c,
      name: INITIAL_COUNTRIES[c.code].name,
      taxType: c.code === "us" ? "SALES_TAX" : "VAT",
      taxRate: c.code === "in" ? 18 : 5,
    }))
  );

  // FX rates are sourced from the live commerce-service markets registry (see effect below);
  // the static FX_RATES seed is only an offline fallback until that hydrates.
  const [fxRates, setFxRates] = useState<FXRate[]>(FX_RATES);

  // Hydrate per-market currency / tax / FX from the authoritative public /commerce/markets feed
  // (C3). The backend registry is the single source of truth; on any failure we keep the static
  // COUNTRIES_CONFIG / FX_RATES seeds so pricing never breaks. Runs once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const registry = await getMarkets();
        if (cancelled) return;
        if (registry.markets.length === 0) {
          // Fail-open: an empty registry means the public /commerce/markets feed was
          // unreachable or misconfigured (getMarkets() swallows the error and returns EMPTY).
          // We keep the static COUNTRIES_CONFIG / FX_RATES seeds, but surface a diagnostic so a
          // wrong NEXT_PUBLIC_COMMERCE_URL serving stale static FX is not invisible to operators.
          // eslint-disable-next-line no-console -- deliberate operator diagnostic: stale-FX fail-open signal
          console.warn(
            "[store] markets hydration failed; using static FX seeds",
            new Error("empty markets registry (commerce-service /commerce/markets unreachable or misconfigured)")
          );
          return;
        }
        const byCountry = new Map(registry.markets.map((m) => [m.country, m]));

        setCountryConfigs((prev) =>
          prev.map((c) => {
            const m = byCountry.get(c.code);
            if (!m) return c;
            return {
              ...c,
              currency: m.currencyCode,
              taxType: m.taxType,
              taxRate: m.taxRate,
              fxRate: m.fxRate,
            };
          })
        );

        setFxRates(
          registry.markets.map((m): FXRate => ({
            currencyCode: m.currencyCode,
            baseCurrency: registry.baseCurrency,
            rate: m.fxRate,
            spread: 0,
            lastUpdated: new Date().toISOString(),
            source: "commerce-service/markets",
          }))
        );
      } catch (err) {
        if (cancelled) return;
        // Defensive: getMarkets() is designed never to throw, but if anything in this hydration
        // path does, keep the static FX seeds (fail-open) and surface a visible diagnostic.
        // eslint-disable-next-line no-console -- deliberate operator diagnostic: stale-FX fail-open signal
        console.warn("[store] markets hydration failed; using static FX seeds", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    theme: { primary: "#7E3F98", accent: "#D4AF37", fontFamily: "Alegreya" },
    emergencyMode: false,
    isGuideMode: false,
    adminViewMode: "advanced",
    performance: { autoScalingStatus: "Optimized" },
  });

  useEffect(() => {
    initializeGlobalHandlers();
  }, []);

  // Wishlist persistence + server sync.
  //
  // GUEST: localStorage is the source of truth (survives reloads, no account needed).
  // AUTHENTICATED: the wishlist-service is authoritative. We load the server wishlist,
  // best-effort merge any locally-saved guest items UP to the server (merge-on-login),
  // and thereafter every toggle mirrors to the API. localStorage is still written so the
  // guest experience is intact and a logout falls back to the last known list.
  //
  // The server stores only { productId, variantId? }; the storefront keeps full Product
  // objects, so server productIds are resolved against the loaded `products` catalog.
  const _wishlistHydrated = useRef(false);
  const _wishlistServerSynced = useRef(false);

  // 1) Hydrate from localStorage on mount (client-only, guest source of truth).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("amarise.wishlist");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setWishlist(parsed);
      }
    } catch {
      /* storage unavailable — wishlist stays in-memory for this session */
    }
    _wishlistHydrated.current = true;
  }, []);

  // 2) Persist every change to localStorage (after hydration, so the empty initial
  //    state can never clobber a saved list before it is restored).
  useEffect(() => {
    if (!_wishlistHydrated.current) return;
    try {
      window.localStorage.setItem("amarise.wishlist", JSON.stringify(wishlist));
    } catch {
      /* ignore */
    }
  }, [wishlist]);

  // 3) Server sync for authenticated shoppers. Runs once a token is present AND the
  //    catalog has loaded (so server productIds resolve to full Product objects). Merges
  //    local → server best-effort, then reconciles the local list with the server's.
  useEffect(() => {
    if (!_wishlistHydrated.current) return;
    if (_wishlistServerSynced.current) return;
    if (!getAccessToken()) return; // guest — localStorage only
    if (products.length === 0) return; // wait for catalog so ids resolve to Products

    let cancelled = false;
    (async () => {
      const res = await wishlistApi.getMine();
      if (cancelled || !res.ok) return; // fail-soft: keep the local list on error

      const serverIds = new Set((res.data.items ?? []).map((i) => i.productId));

      // Merge-on-login: push locally-saved items the server does not have yet.
      const localOnly = wishlist.filter((p) => !serverIds.has(p.id));
      await Promise.allSettled(
        localOnly.map((p) => wishlistApi.addItem(p.id)),
      );
      localOnly.forEach((p) => serverIds.add(p.id));

      if (cancelled) return;

      // Reconcile the in-memory list to the authoritative server set: keep already-loaded
      // Product objects, resolve the rest from the catalog (drop ids we cannot resolve).
      const byId = new Map(products.map((p) => [p.id, p]));
      const reconciled: Product[] = [];
      serverIds.forEach((id) => {
        const existing = wishlist.find((p) => p.id === id) ?? byId.get(id);
        if (existing) reconciled.push(existing);
      });
      setWishlist(reconciled);
      _wishlistServerSynced.current = true;
    })();

    return () => {
      cancelled = true;
    };
    // Re-run when the catalog hydrates; the guards above make repeat runs cheap/no-ops.
  }, [products, wishlist]);

  // Persist the shopping bag locally so it survives reloads / new tabs (the order-service cart
  // API is cartId-keyed and created at checkout; localStorage is the cross-reload source for the
  // in-progress bag).
  //
  // Why a ref-guard + two effects instead of a useState lazy initializer:
  //   The cart MUST start empty on the server (SSR has no localStorage); a lazy initializer that
  //   read localStorage would either crash on the server or diverge from the server-rendered empty
  //   cart and trip a Next.js hydration mismatch. So we initialize empty, then hydrate from storage
  //   in a mount-only effect (client-only, post-hydration — safe).
  //
  // Effect-ordering safety: React runs effects in declaration order, so on mount the HYDRATE
  // effect below runs (and flips `_cartHydrated` true) before the SAVE effect's first reactive run
  // matters. `_cartHydrated` gates the SAVE effect so the empty initial `cart` state can never
  // clobber a persisted cart before it has been restored. After hydration, every `cart` change
  // writes through to storage.
  const _cartHydrated = useRef(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("amarise.cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch {
      /* storage unavailable — cart stays in-memory for this session */
    }
    _cartHydrated.current = true;
  }, []);
  useEffect(() => {
    if (!_cartHydrated.current) return;
    try {
      window.localStorage.setItem("amarise.cart", JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  const activeHub = useMemo(() => {
    if (!currentUser) return "global";
    if (currentUser.role === "super_admin") return adminJurisdiction;
    return currentUser.country as CountryCode;
  }, [currentUser, adminJurisdiction]);

  // The logged-in customer's OWN VIP record, or null. Never falls back to "the first VIP in
  // some list" — that was the bug (every visitor saw one shared customer's private wallet/
  // certificates regardless of who they were).
  const activeVip = myVipClient;

  const scopedProducts = useMemo(
    () =>
      activeHub === "global"
        ? products
        : products.filter((p) => p.regions.includes(activeHub) || p.isGlobal),
    [products, activeHub]
  );

  const scopedTransactions = useMemo(
    () =>
      activeHub === "global"
        ? transactions
        : transactions.filter((t) => t.country === activeHub),
    [transactions, activeHub]
  );

  const scopedNotifications = useMemo(
    () =>
      activeHub === "global"
        ? notifications
        : notifications.filter(
            (n) => n.country === activeHub || n.country === "global"
          ),
    [notifications, activeHub]
  );

  const scopedErrors = useMemo(
    () =>
      activeHub === "global"
        ? maisonErrors
        : maisonErrors.filter((e) => e.country === activeHub),
    [maisonErrors, activeHub]
  );

  const scopedAlerts = useMemo(
    () =>
      activeHub === "global"
        ? alerts
        : alerts.filter((a) => a.country === activeHub),
    [alerts, activeHub]
  );

  const scopedAuditLogs = useMemo(
    () =>
      activeHub === "global"
        ? auditLogs
        : auditLogs.filter((l) => l.country === activeHub),
    [auditLogs, activeHub]
  );

  const scopedFraudLogs = useMemo(
    () =>
      activeHub === "global"
        ? fraudLogs
        : fraudLogs.filter((l) => l.metadata?.hub === activeHub),
    [fraudLogs, activeHub]
  );

  const scopedPricingOptimizations = useMemo(
    () =>
      activeHub === "global"
        ? pricingOptimizations
        : pricingOptimizations.filter((p) => p.country === activeHub),
    [pricingOptimizations, activeHub]
  );

  const scopedEvents = useMemo(() => {
    const logs = eventBus.getLogs();
    return activeHub === "global"
      ? logs
      : logs.filter((e) => e.countryCode === activeHub);
  }, [activeHub, transactions]);

  const scopedJobs = useMemo(() => {
    const logs = workerEngine.getRegistry();
    return activeHub === "global"
      ? logs
      : logs.filter((j) => j.country === activeHub);
  }, [activeHub, transactions]);

  const recordLog = (
    action: string,
    entity: string,
    country: string,
    before?: any,
    after?: any,
    reason?: string
  ) => {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      actorName: currentUser?.name || "System",
      actorRole: currentUser?.role || "SYSTEM",
      country,
      action,
      entity,
      severity: "low",
      beforeState: before,
      afterState: after,
      reason,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  const value: AppContextType = {
    countryConfigs,
    brandConfigs: BRANDS_CONFIG,
    currentUser,
    adminJurisdiction,
    globalSyncHistory,
    products,
    catalogSource,
    transactions,
    notifications,
    globalSettings,
    cart,
    wishlist,
    isCartOpen,
    activeVip,
    supportTickets,
    activeHub,
    currentLanguage,
    paymentPlans: PAYMENT_PLANS,
    subscriptions: SUBSCRIPTIONS,
    fxRates,
    scopedProducts,
    scopedTransactions,
    scopedNotifications,
    scopedErrors,
    scopedAlerts,
    scopedMetrics: metrics,
    scopedCertificates: activeVip?.certificates || [],
    scopedBrandIntegrity: brandIntegrityIssues,
    scopedWorkflows: [],
    scopedShipments: shipments,
    scopedAuditLogs,
    scopedFraudLogs,
    scopedPricingOptimizations,
    scopedEvents,
    scopedJobs,
    aiModules,
    aiLogs,
    aiSuggestions,
    integrations: [],
    apiLogs: [],
    systemHealth: obsEngine.calculateHealth(
      activeHub === "global" ? "global" : activeHub
    ),
    collections,
    editorials: EDITOR_INITIAL,
    buyingGuides: BUYING_GUIDES,
    activeBrandId,
    seoRegistry,
    socialMetrics,
    isShowcaseMode,
    setShowcaseMode,

    // Missing properties implementations
    maisonErrors,
    brandIntegrityIssues,
    systemLogs: [],
    warehouseLogs: [],
    scopedQATests: [],
    runQATest: (id) => {},
    runAllQATests: () => {},
    runStressTest: (id) => {},
    scopedStressTests: [],
    scopedLiveRequests: activeVip?.liveRequests || [],

    setCurrentUser,
    setAdminJurisdiction,
    setCountryEnabled: (code, enabled) =>
      setCountryConfigs((prev) =>
        prev.map((c) => (c.code === code ? { ...c, enabled } : c))
      ),
    updateGlobalSettings: setGlobalSettings,
    setAdminViewMode: (mode) =>
      setGlobalSettings((p) => ({ ...p, adminViewMode: mode })),
    markNotificationRead: (id) =>
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      ),
    updateTransactionStatus: (id, status) =>
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      ),
    upsertProduct: (p) =>
      setProducts((prev) => {
        const exists = prev.find((i) => i.id === p.id);
        if (exists) {
          recordLog("Product Update", "Registry", "global", exists, p);
          return prev.map((i) => (i.id === p.id ? p : i));
        }
        recordLog("Product Creation", "Registry", "global", null, p);
        return [p, ...prev];
      }),
    addToCart: (p) => {
      // Unified-analytics ecommerce event (fire-and-forget via the first-party tracker).
      if (typeof window !== 'undefined') {
        (window as unknown as { baalvion?: { track?: (e: string, props?: Record<string, unknown>) => void } })
          .baalvion?.track?.('add_to_cart', {
            value: p.price ?? p.basePrice,
            metadata: { productId: p.id, name: p.name },
          });
      }
      setCart((prev) => {
        const existing = prev.find((item) => item.id === p.id);
        if (existing)
          return prev.map((item) =>
            item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        return [...prev, { ...p, quantity: 1 }];
      });
    },
    removeFromCart: (id) => setCart((prev) => prev.filter((i) => i.id !== id)),
    updateCartQuantity: (id, quantity) =>
      setCart((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, Math.floor(quantity)) } : item
        )
      ),
    clearCart: () => setCart([]),
    setCartOpen,
    toggleWishlist: (p) =>
      setWishlist((prev) => {
        const isRemoving = !!prev.find((i) => i.id === p.id);
        // Mirror to the wishlist-service for authenticated shoppers (fire-and-forget,
        // optimistic). Guests persist via localStorage only. Errors are swallowed so the
        // UI stays responsive; the next authenticated load reconciles any drift.
        if (getAccessToken()) {
          const op = isRemoving ? wishlistApi.removeItem(p.id) : wishlistApi.addItem(p.id);
          void op.catch(() => {
            /* best-effort: local state is authoritative for this session */
          });
        }
        return isRemoving ? prev.filter((i) => i.id !== p.id) : [...prev, p];
      }),
    // Optimistic local update (immediate UI feedback) + real crm-service persistence in the
    // background (same fire-and-forget pattern as toggleWishlist above) — reconciles with the
    // server's authoritative row when it responds, so a failed write self-corrects on next load.
    topUpWallet: (amt) => {
      if (!activeVip) return;
      setMyVipClient((v) => (v ? { ...v, walletBalance: v.walletBalance + amt } : v));
      void adjustMyWallet(amt, 'Wallet top-up').then((updated) => {
        if (updated) setMyVipClient(updated);
      });
    },
    requestLiveSession: (pid, name) => {
      if (activeVip && activeVip.walletBalance >= 250) {
        setMyVipClient((v) =>
          v
            ? {
                ...v,
                walletBalance: v.walletBalance - 250,
                liveRequests: [
                  {
                    id: `req-${Date.now()}`,
                    productId: pid,
                    productName: name,
                    status: "scheduled",
                    requestedAt: new Date().toISOString(),
                  },
                  ...(v.liveRequests || []),
                ],
              }
            : v
        );
        void adjustMyWallet(-250, `Live shopping session — ${name}`).then((updated) => {
          if (updated) setMyVipClient((v) => (v ? { ...v, ...updated, liveRequests: v.liveRequests } : updated));
        });
        void createAppointment({
          customerName: activeVip.name,
          customerEmail: activeVip.email,
          type: 'Live Shopping Session',
          notes: `Product: ${name} (${pid})`,
        });
        return true;
      }
      return false;
    },
    createInvoice: (inv) => {},
    createTransaction: (tx) => setTransactions((prev) => [tx, ...prev]),
    deleteProduct: (id) =>
      setProducts((prev) => prev.filter((p) => p.id !== id)),
    resolveAlert: (id) =>
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "resolved" } : a))
      ),
    resolveMaisonError: (id) =>
      setMaisonErrors((prev) =>
        prev.map((e) => (e.id === id ? { ...e, resolved: true } : e))
      ),
    resolveBrandIntegrity: (id) =>
      setBrandIntegrityIssues((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "fixed" } : i))
      ),
    performWarehouseIntake: (pid, qty, reason) =>
      setProducts((prev) =>
        prev.map((p) => (p.id === pid ? { ...p, stock: p.stock + qty } : p))
      ),
    recordMetric: (m) =>
      setMetrics((prev) =>
        [
          { ...m, id: `m-${Date.now()}`, timestamp: new Date().toISOString() },
          ...prev,
        ].slice(0, 100)
      ),
    recordFraudLog: (l) =>
      setFraudLogs((prev) => [{ ...l, id: `f-${Date.now()}` }, ...prev]),
    updateAIModule: (id, enabled, level) =>
      setAiModules((prev) =>
        prev.map((m) => (m.id === id ? { ...m, enabled, level } : m))
      ),
    addAILog: (l) => setAiLogs((prev) => [l, ...prev]),
    upsertAISuggestion: (s) => setAiSuggestions((prev) => [s, ...prev]),
    updateSuggestionStatus: (id, status) =>
      setAiSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      ),
    runWorkflowTask: (id) => {},
    runWorkflowSequence: (n, c) => {},
    setLanguage: (l) => {
      setCurrentLanguage(l);
      // i18n.setLanguage(l); // TODO: Implement i18n when available
    },
    optimizeRegistryPricing: (hub) => {
      // NOTE: inquiries are no longer a global in-memory list (see useMyInquiries) — this
      // admin-only pricing audit has no live caller today; pass [] rather than fabricate data.
      const suggestions = DynamicPricingEngine.auditRegistryPricing(
        products,
        [],
        hub
      );
      setPricingOptimizations((prev) => [...suggestions, ...prev]);
    },
    updateShipmentStatus: (id, status) =>
      setShipments((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      ),
    createShipment: (oid, uid, c) =>
      setShipments((prev) => [
        {
          id: `shp-${Date.now()}`,
          orderId: oid,
          userId: uid,
          country: c,
          status: "pending",
          trackingId: `TRK-${Date.now()}`,
          courierName: "Maison Courier",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          history: [],
        } as Shipment,
        ...prev,
      ]),
    upsertAppointment: (a) => {},
    upsertSEOMetadata: (m) =>
      setSeoRegistry((prev) =>
        prev.find((i) => i.path === m.path)
          ? prev.map((i) => (i.path === m.path ? m : i))
          : [m, ...prev]
      ),
    toggleProductVipStatus: (id) =>
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isVip: !p.isVip } : p))
      ),
    lockProductForEditing: (id) => true,
    trackShare: (id, c) => {},
    toggleLike: (id, c) => {},
    markAlertRead: (id) => {},
    updateInventory: (id, h, adj) =>
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, stock: Math.max(0, p.stock + adj) } : p
        )
      ),
    refundTransaction: (id, r) =>
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "Refunded" } : t))
      ),
    toggleEmergencyMode: () =>
      setGlobalSettings((prev) => ({
        ...prev,
        emergencyMode: !prev.emergencyMode,
      })),
    triggerReindex: (t) => {},
    upsertCampaign: (c) => {},
    submitApproval: (id) => {},
    automationRules,
    toggleRule: (id) =>
      setAutomationRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
      ),
    upsertRule: (rule) =>
      setAutomationRules((prev) =>
        prev.find((r) => r.id === rule.id)
          ? prev.map((r) => (r.id === rule.id ? rule : r))
          : [rule, ...prev]
      ),
    cmsSections,
    upsertCMSSection: (section) =>
      setCmsSections((prev) =>
        prev.find((s) => s.id === section.id)
          ? prev.map((s) => (s.id === section.id ? section : s))
          : [section, ...prev]
      ),
    upsertCollection: (collection) => {},
    upsertEditorial: (editorial) => {},
    updateCountryConfig: (code, config) =>
      setCountryConfigs((prev) =>
        prev.map((c) => (c.code === code ? { ...c, ...config } : c))
      ),
    addTicketMessage: (id, t, s) =>
      setSupportTickets((prev) =>
        prev.map((tk) =>
          tk.id === id
            ? {
                ...tk,
                messages: [
                  ...tk.messages,
                  {
                    id: `m-${Date.now()}`,
                    sender: s,
                    text: t,
                    timestamp: new Date().toISOString(),
                  },
                ],
              }
            : tk
        )
      ),
    updateTicketStatus: (id, s) =>
      setSupportTickets((prev) =>
        prev.map((tk) => (tk.id === id ? { ...tk, status: s } : tk))
      ),
    getLocalizedPrice: (p) => `$${p.toLocaleString()}`,
    executeSafeSync: (cats, targets) => {
      const session: GlobalSyncSession = {
        id: `sync-${Date.now()}`,
        timestamp: new Date().toISOString(),
        categories: cats,
        targets,
        actorName: currentUser?.name || "System",
        status: "applied",
      };
      setGlobalSyncHistory((prev) => [session, ...prev]);
    },
    setActiveBrand: setActiveBrandId,
    publishEvent: (type, source, payload) => {
      eventBus.publish({
        type,
        source,
        countryCode: activeHub as any,
        payload,
      });
    },
    recordLog,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
}
