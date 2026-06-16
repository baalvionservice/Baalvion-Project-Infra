import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { EnterpriseProvider } from "@/contexts/EnterpriseContext";
import { OrgProvider } from "@/contexts/OrgContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelmetProvider } from "react-helmet-async";
import { ChatWidget } from "@/components/layout/ChatWidget";

// Layouts
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import AdminLayout from "@/pages/admin/AdminLayout";

// Public Pages
import HomePage from "@/pages/HomePage";
import PricingPage from "@/pages/public/PricingPage";
import StatusPage from "@/pages/public/StatusPage";
import AuthPage from "@/pages/public/AuthPage";
import SsoCallback from "@/pages/public/SsoCallback";
import AcceptInvitePage from "@/pages/public/AcceptInvitePage";
import ForgotPasswordPage from "@/pages/public/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/public/ResetPasswordPage";
import CaseStudiesPage from "@/pages/public/CaseStudiesPage";
import CalculatorPage from "@/pages/public/CalculatorPage";
import DocsPage from "@/pages/public/DocsPage";
import ResidentialProxiesPage from "@/pages/public/ResidentialProxiesPage";
import MobileProxiesPage from "@/pages/public/MobileProxiesPage";
import DatacenterProxiesPage from "@/pages/public/DatacenterProxiesPage";
import AboutPage from "@/pages/public/AboutPage";
import PrivacyPolicyPage from "@/pages/public/PrivacyPolicyPage";
import AcceptableUsePolicyPage from "@/pages/public/AcceptableUsePolicyPage";
import RefundPolicyPage from "@/pages/public/RefundPolicyPage";
import TermsOfServicePage from "@/pages/public/TermsOfServicePage";
import ContactPage from "@/pages/public/ContactPage";
import SecurityPage from "@/pages/public/SecurityPage";
import SLAPage from "@/pages/public/SLAPage";
import CompliancePage from "@/pages/public/CompliancePage";
import TransparencyPage from "@/pages/public/TransparencyPage";
import EnterprisePage from "@/pages/public/EnterprisePage";
import BookDemoPage from "@/pages/public/BookDemoPage";
import IntegrationsPage from "@/pages/public/IntegrationsPage";
import ProxyComparisonPage from "@/pages/public/ProxyComparisonPage";
import InfrastructurePage from "@/pages/public/InfrastructurePage";

// App Pages
import Dashboard from "@/pages/app/Dashboard";
import ProxyManagement from "@/pages/app/ProxyManagement";
import PresetsProfiles from "@/pages/app/PresetsProfiles";
import SubUsers from "@/pages/app/SubUsers";
import Billing from "@/pages/app/Billing";
import BillingCheckout from "@/pages/app/BillingCheckout";
import BillingMethods from "@/pages/app/BillingMethods";
import BillingHistory from "@/pages/app/BillingHistory";
import BillingSubscription from "@/pages/app/BillingSubscription";
import ApiKeys from "@/pages/app/ApiKeys";
import Analytics from "@/pages/app/Analytics";
import Settings from "@/pages/app/Settings";
import AuditLogs from "@/pages/app/AuditLogs";
import Compliance from "@/pages/app/Compliance";
import SecurityCenter from "@/pages/app/SecurityCenter";
import ContractManagement from "@/pages/app/ContractManagement";
import SystemAudit from "@/pages/app/SystemAudit";
import AccountSuspended from "@/pages/app/AccountSuspended";
import PaymentRequired from "@/pages/app/PaymentRequired";
import OrganizationOverview from "@/pages/app/OrganizationOverview";
import OrganizationMembers from "@/pages/app/OrganizationMembers";
import OrganizationRoles from "@/pages/app/OrganizationRoles";
import OrganizationBilling from "@/pages/app/OrganizationBilling";
import SupportCenter from "@/pages/app/SupportCenter";
import ProxyTester from "@/pages/app/ProxyTester";
import ProxyAccess from "@/pages/app/ProxyAccess";
import PrivacyCenter from "@/pages/app/PrivacyCenter";
import Enterprise from "@/pages/app/Enterprise";
import DataCenter from "@/pages/app/DataCenter";
import NotificationsPage from "@/pages/app/NotificationsPage";
import NetworkAnalytics from "@/pages/app/NetworkAnalytics";
import Partner from "@/pages/app/Partner";
import Marketplace from "@/pages/app/Marketplace";


// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminPlans from "@/pages/admin/AdminPlans";
import AdminTickets from "@/pages/admin/AdminTickets";
import AdminProviders from "@/pages/admin/AdminProviders";
import AdminSupplierRouting from "@/pages/admin/AdminSupplierRouting";
import AdminAbuseMonitoring from "@/pages/admin/AdminAbuseMonitoring";
import AdminSystemHealth from "@/pages/admin/AdminSystemHealth";
import AdminControlRoom from "@/pages/admin/AdminControlRoom";
import AdminNetworkMap from "@/pages/admin/AdminNetworkMap";
import AdminRiskCenter from "@/pages/admin/AdminRiskCenter";
import AdminGrowth from "@/pages/admin/AdminGrowth";
import AdminCustomerHealth from "@/pages/admin/AdminCustomerHealth";
import AdminMiddleware from "@/pages/admin/AdminMiddleware";
import AdminPricingSimulator from "@/pages/admin/AdminPricingSimulator";
import AdminCohortRetention from "@/pages/admin/AdminCohortRetention";
import AdminTenants from "@/pages/admin/AdminTenants";
import AdminFeatureFlags from "@/pages/admin/AdminFeatureFlags";
import AdminWhiteLabel from "@/pages/admin/AdminWhiteLabel";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminRevenue from "@/pages/admin/AdminRevenue";
import AdminChargebacks from "@/pages/admin/AdminChargebacks";
import AdminOrchestration from "@/pages/admin/AdminOrchestration";
import AdminTrustSafety from "@/pages/admin/AdminTrustSafety";
import AdminEdgeNetwork from "@/pages/admin/AdminEdgeNetwork";
import AdminIntelligence from "@/pages/admin/AdminIntelligence";
import AdminFinance from "@/pages/admin/AdminFinance";
import AdminMarketplace from "@/pages/admin/AdminMarketplace";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";

// Public extra pages
import CookiePolicyPage from "@/pages/public/CookiePolicyPage";
import ChangelogPage from "@/pages/public/ChangelogPage";
import FAQPage from "@/pages/public/FAQPage";
import BlogPage from "@/pages/public/BlogPage";
import EnterpriseSMBComparisonPage from "@/pages/public/EnterpriseSMBComparisonPage";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";
import { useReferralCapture } from "@/hooks/useReferralCapture";

const queryClient = new QueryClient();

// Captures `?ref=` affiliate codes on first load; renders nothing.
const ReferralCapture = () => { useReferralCapture(); return null; };

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="baalvion-ui-theme">
        <AuthProvider>
        <EnterpriseProvider>
          <OrgProvider>
          <TooltipProvider>
            <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/status" element={<StatusPage />} />
                  <Route path="/case-studies" element={<CaseStudiesPage />} />
                  <Route path="/calculator" element={<CalculatorPage />} />
                  <Route path="/docs" element={<DocsPage />} />
                  <Route path="/residential" element={<ResidentialProxiesPage />} />
                  <Route path="/mobile" element={<MobileProxiesPage />} />
                  <Route path="/datacenter" element={<DatacenterProxiesPage />} />
                  <Route path="/enterprise" element={<EnterprisePage />} />
                  <Route path="/book-demo" element={<BookDemoPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/aup" element={<AcceptableUsePolicyPage />} />
                  <Route path="/refund" element={<RefundPolicyPage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/security" element={<SecurityPage />} />
                  <Route path="/sla" element={<SLAPage />} />
                  <Route path="/compliance-info" element={<CompliancePage />} />
                  <Route path="/transparency" element={<TransparencyPage />} />
                  <Route path="/integrations" element={<IntegrationsPage />} />
                  <Route path="/proxy-comparison" element={<ProxyComparisonPage />} />
                  <Route path="/infrastructure" element={<InfrastructurePage />} />
                  <Route path="/cookies" element={<CookiePolicyPage />} />
                  <Route path="/changelog" element={<ChangelogPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/enterprise-vs-smb" element={<EnterpriseSMBComparisonPage />} />
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/signup" element={<AuthPage />} />
                  <Route path="/accept-invite" element={<AcceptInvitePage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                </Route>

                {/* App Routes */}
                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="proxies" element={<ProxyManagement />} />
                  <Route path="proxy-access" element={<ProxyAccess />} />
                  <Route path="privacy" element={<PrivacyCenter />} />
                  <Route path="enterprise" element={<Enterprise />} />
                  <Route path="presets" element={<PresetsProfiles />} />
                  <Route path="sub-users" element={<SubUsers />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="network-analytics" element={<NetworkAnalytics />} />
                  <Route path="partner" element={<Partner />} />
                  <Route path="marketplace" element={<Marketplace />} />
                  <Route path="billing" element={<Billing />} />
                  <Route path="billing/checkout" element={<BillingCheckout />} />
                  <Route path="billing/methods" element={<BillingMethods />} />
                  <Route path="billing/history" element={<BillingHistory />} />
                  <Route path="billing/subscription" element={<BillingSubscription />} />
                  <Route path="api-keys" element={<ApiKeys />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="audit-logs" element={<AuditLogs />} />
                  <Route path="compliance" element={<Compliance />} />
                  <Route path="security" element={<SecurityCenter />} />
                  <Route path="contract" element={<ContractManagement />} />
                  <Route path="audit" element={<SystemAudit />} />
                  <Route path="account-suspended" element={<AccountSuspended />} />
                  <Route path="payment-required" element={<PaymentRequired />} />
                  <Route path="organization" element={<OrganizationOverview />} />
                  <Route path="organization/members" element={<OrganizationMembers />} />
                  <Route path="organization/roles" element={<OrganizationRoles />} />
                  <Route path="organization/billing" element={<OrganizationBilling />} />
                  <Route path="support" element={<SupportCenter />} />
                  <Route path="tester" element={<ProxyTester />} />
                  <Route path="data" element={<DataCenter />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                </Route>


                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="control-room" element={<AdminControlRoom />} />
                  <Route path="network-map" element={<AdminNetworkMap />} />
                  <Route path="risk-center" element={<AdminRiskCenter />} />
                  <Route path="growth" element={<AdminGrowth />} />
                  <Route path="customer-health" element={<AdminCustomerHealth />} />
                  <Route path="middleware" element={<AdminMiddleware />} />
                  <Route path="pricing-sim" element={<AdminPricingSimulator />} />
                  <Route path="cohort" element={<AdminCohortRetention />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="plans" element={<AdminPlans />} />
                  <Route path="providers" element={<AdminProviders />} />
                  <Route path="orchestration" element={<AdminOrchestration />} />
                  <Route path="trust-safety" element={<AdminTrustSafety />} />
                  <Route path="edge-network" element={<AdminEdgeNetwork />} />
                  <Route path="intelligence" element={<AdminIntelligence />} />
                  <Route path="finance" element={<AdminFinance />} />
                  <Route path="marketplace" element={<AdminMarketplace />} />
                  <Route path="audit-logs" element={<AdminAuditLogs />} />
                  <Route path="routing" element={<AdminSupplierRouting />} />
                  <Route path="abuse" element={<AdminAbuseMonitoring />} />
                  <Route path="health" element={<AdminSystemHealth />} />
                  <Route path="tickets" element={<AdminTickets />} />
                  <Route path="tenants" element={<AdminTenants />} />
                  <Route path="feature-flags" element={<AdminFeatureFlags />} />
                  <Route path="whitelabel" element={<AdminWhiteLabel />} />
                  <Route path="payments" element={<AdminPayments />} />
                  <Route path="revenue" element={<AdminRevenue />} />
                  <Route path="chargebacks" element={<AdminChargebacks />} />
                </Route>

                <Route path="/auth/sso-callback" element={<SsoCallback />} />
                <Route path="/500" element={<ServerError />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <ReferralCapture />
              <ChatWidget />
            </BrowserRouter>
            </ErrorBoundary>
          </TooltipProvider>
          </OrgProvider>
        </EnterpriseProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
