"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
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
  PrivateInquiry,
  LeadConversation,
  MaisonMetric,
  MaisonAlert,
  SystemHealthScore,
  FraudLog,
  DynamicPrice,
  CMSSection,
  Collection,
  Editorial,
  SEOMetadata,
  SalesScript,
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
  PRODUCTS as INITIAL_PRODUCTS,
  COUNTRIES as INITIAL_COUNTRIES,
  VIP_CLIENTS as INITIAL_VIP_CLIENTS,
  SUPPORT_TICKETS as INITIAL_TICKETS,
  ADMIN_ACCOUNTS,
  CAMPAIGNS,
  INVOICES as INITIAL_INVOICES,
  AFFILIATES,
  RETURNS as INITIAL_RETURNS,
  EDITOR_INITIAL,
  BUYING_GUIDES,
  COLLECTIONS as INITIAL_COLLECTIONS,
  INDEXING_STATUS as INITIAL_INDEXING,
  SUPPORT_STATS as INITIAL_SUPPORT_STATS,
  VENDORS,
  DEPARTMENTS,
  CATEGORIES,
  PAYMENT_PLANS,
  SUBSCRIPTIONS,
  FX_RATES,
  TAX_RULES,
} from "./mock-data";
import { MOCK_SESSION_USER, MaisonUser } from "./permissions/mock-users";
import { COUNTRIES_CONFIG, BRANDS_CONFIG } from "./mock-global-config";
import { MOCK_INQUIRIES, MOCK_CONVERSATIONS } from "./mock-sales";
import { ACQUISITION_SCRIPTS } from "./mock-sales-system";
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
  transactions: Transaction[];
  notifications: MaisonNotification[];
  globalSettings: GlobalSettings;
  cart: CartItem[];
  wishlist: Product[];
  isCartOpen: boolean;
  activeVip: VipClient | null;
  supportTickets: SupportTicket[];
  privateInquiries: PrivateInquiry[];
  leadConversations: LeadConversation[];
  activeHub: CountryCode | "global";
  currentLanguage: SupportedLanguage;
  paymentPlans: PaymentPlan[];
  subscriptions: Subscription[];
  fxRates: FXRate[];
  taxRules: TaxRule[];

  // Scoped Data
  scopedProducts: Product[];
  scopedTransactions: Transaction[];
  scopedNotifications: MaisonNotification[];
  scopedInquiries: PrivateInquiry[];
  scopedErrors: MaisonError[];
  scopedAlerts: MaisonAlert[];
  scopedMetrics: MaisonMetric[];
  scopedCertificates: any[];
  scopedBrandIntegrity: BrandIntegrityIssue[];
  scopedWorkflows: WorkflowTask[];
  scopedReturns: ReturnRequest[];
  scopedShipments: Shipment[];
  scopedAuditLogs: AuditLogEntry[];
  scopedFraudLogs: FraudLog[];
  scopedPricingOptimizations: DynamicPrice[];
  scopedEvents: any[];
  scopedJobs: BackgroundJob[];

  // Support
  supportStats: any;

  // AI
  aiModules: AIModuleStatus[];
  aiLogs: AIActionLog[];
  aiSuggestions: AISuggestion[];

  // Settings
  integrations: any[];
  apiLogs: any[];
  indexingStatus: any;
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
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
  toggleWishlist: (p: Product) => void;
  topUpWallet: (amount: number) => void;
  requestLiveSession: (productId: string, productName: string) => boolean;
  addLeadMessage: (
    inquiryId: string,
    text: string,
    sender: "client" | "curator"
  ) => void;
  updateInquiryStatus: (id: string, status: any) => void;
  upsertPrivateInquiry: (i: PrivateInquiry) => void;
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
  processReturn: (id: string, status: any) => void;
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
  upsertTemplate: (t: SalesScript) => void;
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
  verifyClient: (id: string) => void;
  addTicketMessage: (id: string, text: string, sender: string) => void;
  updateTicketStatus: (id: string, status: any) => void;
  getLocalizedPrice: (price: number) => string;
  activeVendor: any | null;
  setActiveVendor: (v: any | null) => void;
  vendors: any[];
  messagingTemplates: SalesScript[];
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
  activeCampaigns: Campaign[];
  affiliates: Affiliate[];
  vipClients: VipClient[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MaisonUser | null>(
    MOCK_SESSION_USER
  );
  const [adminJurisdiction, setAdminJurisdiction] = useState<
    CountryCode | "global"
  >("global");
  const [currentLanguage, setCurrentLanguage] =
    useState<SupportedLanguage>("en");
  const [activeBrandId, setActiveBrandId] = useState("amarise-luxe");
  const [isShowcaseMode, setShowcaseMode] = useState(true);

  const [products, setProducts] = useState<Product[]>(
    INITIAL_PRODUCTS.map(
      (p) =>
        ({
          ...p,
          isGlobal: true,
          regions: ["us", "uk", "ae", "in", "sg"],
          status: "published",
        } as Product)
    )
  );

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<MaisonNotification[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [vips, setVips] = useState<VipClient[]>(INITIAL_VIP_CLIENTS);
  const [supportTickets, setSupportTickets] =
    useState<SupportTicket[]>(INITIAL_TICKETS);
  const [privateInquiries, setPrivateInquiries] =
    useState<PrivateInquiry[]>(MOCK_INQUIRIES);
  const [leadConversations, setLeadConversations] =
    useState<LeadConversation[]>(MOCK_CONVERSATIONS);
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
  const [returns, setReturns] = useState<ReturnRequest[]>(INITIAL_RETURNS);
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
  const [activeVendor, setActiveVendor] = useState<any | null>(VENDORS[0]);
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

  const activeHub = useMemo(() => {
    if (!currentUser) return "global";
    if (currentUser.role === "super_admin") return adminJurisdiction;
    return currentUser.country as CountryCode;
  }, [currentUser, adminJurisdiction]);

  const activeVip = useMemo(
    () => vips.find((v) => v.id === currentUser?.id) || vips[0],
    [vips, currentUser]
  );

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

  const scopedInquiries = useMemo(
    () =>
      activeHub === "global"
        ? privateInquiries
        : privateInquiries.filter(
            (i) =>
              i.country.toLowerCase() === activeHub || i.country === "global"
          ),
    [privateInquiries, activeHub]
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
    transactions,
    notifications,
    globalSettings,
    cart,
    wishlist,
    isCartOpen,
    activeVip,
    supportTickets,
    privateInquiries,
    leadConversations,
    activeHub,
    currentLanguage,
    paymentPlans: PAYMENT_PLANS,
    subscriptions: SUBSCRIPTIONS,
    fxRates: FX_RATES,
    taxRules: TAX_RULES,
    scopedProducts,
    scopedTransactions,
    scopedNotifications,
    scopedInquiries,
    scopedErrors,
    scopedAlerts,
    scopedMetrics: metrics,
    scopedCertificates: activeVip?.certificates || [],
    scopedBrandIntegrity: brandIntegrityIssues,
    scopedWorkflows: [],
    scopedReturns: returns,
    scopedShipments: shipments,
    scopedAuditLogs,
    scopedFraudLogs,
    scopedPricingOptimizations,
    scopedEvents,
    scopedJobs,
    supportStats: INITIAL_SUPPORT_STATS,
    aiModules,
    aiLogs,
    aiSuggestions,
    integrations: [],
    apiLogs: [],
    indexingStatus: INITIAL_INDEXING,
    systemHealth: obsEngine.calculateHealth(
      activeHub === "global" ? "global" : activeHub
    ),
    activeVendor,
    vendors: VENDORS,
    messagingTemplates: ACQUISITION_SCRIPTS,
    collections: INITIAL_COLLECTIONS,
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
    activeCampaigns: CAMPAIGNS,
    affiliates: AFFILIATES,
    vipClients: vips,

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
    addToCart: (p) =>
      setCart((prev) => {
        const existing = prev.find((item) => item.id === p.id);
        if (existing)
          return prev.map((item) =>
            item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        return [...prev, { ...p, quantity: 1 }];
      }),
    removeFromCart: (id) => setCart((prev) => prev.filter((i) => i.id !== id)),
    clearCart: () => setCart([]),
    setCartOpen,
    toggleWishlist: (p) =>
      setWishlist((prev) =>
        prev.find((i) => i.id === p.id)
          ? prev.filter((i) => i.id !== p.id)
          : [...prev, p]
      ),
    topUpWallet: (amt) =>
      setVips((prev) =>
        prev.map((v) =>
          v.id === activeVip?.id
            ? { ...v, walletBalance: v.walletBalance + amt }
            : v
        )
      ),
    requestLiveSession: (pid, name) => {
      if (activeVip && activeVip.walletBalance >= 250) {
        setVips((prev) =>
          prev.map((v) =>
            v.id === activeVip.id
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
                    ...v.liveRequests,
                  ],
                }
              : v
          )
        );
        return true;
      }
      return false;
    },
    addLeadMessage: (id, text, sender) =>
      setLeadConversations((prev) =>
        prev.map((c) =>
          c.inquiryId === id
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: `m-${Date.now()}`,
                    sender,
                    text,
                    timestamp: new Date().toISOString(),
                  },
                ],
              }
            : c
        )
      ),
    updateInquiryStatus: (id, status) =>
      setPrivateInquiries((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i))
      ),
    upsertPrivateInquiry: (i) => setPrivateInquiries((prev) => [i, ...prev]),
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
    processReturn: (id, status) =>
      setReturns((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
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
      const suggestions = DynamicPricingEngine.auditRegistryPricing(
        products,
        privateInquiries,
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
    upsertTemplate: (t) => {},
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
    verifyClient: (id) =>
      setVips((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: "verified" } : v))
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
    setActiveVendor,
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
