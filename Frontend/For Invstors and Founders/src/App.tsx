import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MembershipGate } from "@/components/auth/MembershipGate";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { BackendHealthBanner } from "@/components/BackendHealthBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ForumThreads = lazy(() => import("./pages/ForumThreads"));
const ThreadDetail = lazy(() => import("./pages/ThreadDetail"));
const CreateThread = lazy(() => import("./pages/CreateThread"));
const MarketplaceConnected = lazy(() => import("./pages/MarketplaceConnected"));
const ProfileConnected = lazy(() => import("./pages/ProfileConnected"));
const Elite = lazy(() => import("./pages/Elite"));
const EliteApply = lazy(() => import("./pages/EliteApply"));
const EliteStatus = lazy(() => import("./pages/EliteStatus"));
const ElitePremium = lazy(() => import("./pages/ElitePremium"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminApplications = lazy(() => import("./pages/AdminApplications"));
const Deals = lazy(() => import("./pages/Deals"));
const DealDetail = lazy(() => import("./pages/DealDetail"));
const DealManage = lazy(() => import("./pages/DealManage"));
const DealCreate = lazy(() => import("./pages/DealCreate"));
const Investors = lazy(() => import("./pages/Investors"));
const InvestorDetail = lazy(() => import("./pages/InvestorDetail"));
const Connections = lazy(() => import("./pages/Connections"));
const Membership = lazy(() => import("./pages/Membership"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const Founders = lazy(() => import("./pages/Founders"));
const FounderDetail = lazy(() => import("./pages/FounderDetail"));
const AdminMembers = lazy(() => import("./pages/AdminMembers"));
const AdminInvestors = lazy(() => import("./pages/AdminInvestors"));
const AdminCompanies = lazy(() => import("./pages/AdminCompanies"));
const AdminClaims = lazy(() => import("./pages/AdminClaims"));
const DirectoryHub = lazy(() => import("./pages/DirectoryHub"));
const CompanyDetail = lazy(() => import("./pages/CompanyDetail"));
const PersonDetail = lazy(() => import("./pages/PersonDetail"));
const SearchPage = lazy(() => import("./pages/Search"));
const Guides = lazy(() => import("./pages/Guides"));
const GuideDetail = lazy(() => import("./pages/GuideDetail"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Pipeline = lazy(() => import("./pages/Pipeline"));
const Apply = lazy(() => import("./pages/Apply"));
const NotFound = lazy(() => import("./pages/NotFound"));

const ProtocolLanding = lazy(() => import("./pages/protocol/ProtocolLanding"));
const RoleSelector = lazy(() => import("./pages/protocol/RoleSelector"));
const AdminDashboard = lazy(() => import("./pages/protocol/admin/AdminDashboard"));
const ExpertsManagement = lazy(() => import("./pages/protocol/admin/ExpertsManagement"));
const CountryCAD = lazy(() => import("./pages/protocol/admin/CountryCAD"));
const AdminRevenue = lazy(() => import("./pages/protocol/admin/AdminRevenue"));
const AdminUsers = lazy(() => import("./pages/protocol/admin/AdminUsers"));
const ExpertDashboard = lazy(() => import("./pages/protocol/expert/ExpertDashboard"));
const ExpertStudents = lazy(() => import("./pages/protocol/expert/ExpertStudents"));
const ExpertCalls = lazy(() => import("./pages/protocol/expert/ExpertCalls"));
const ExpertFeed = lazy(() => import("./pages/protocol/expert/ExpertFeed"));
const ExpertContent = lazy(() => import("./pages/protocol/expert/ExpertContent"));
const ExpertInvites = lazy(() => import("./pages/protocol/expert/ExpertInvites"));
const StudentDashboard = lazy(() => import("./pages/protocol/student/StudentDashboard"));
const StudentFeed = lazy(() => import("./pages/protocol/student/StudentFeed"));
const StudentCalls = lazy(() => import("./pages/protocol/student/StudentCalls"));
const StudentStore = lazy(() => import("./pages/protocol/student/StudentStore"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen bg-background p-6">
    <div className="max-w-5xl mx-auto space-y-4">
      <Skeleton className="h-12 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-64 mt-4" />
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BackendHealthBanner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/forums" element={<ProtectedRoute><ForumThreads /></ProtectedRoute>} />
              <Route path="/forums/thread/:threadId" element={<ProtectedRoute><ThreadDetail /></ProtectedRoute>} />
              <Route path="/forums/new" element={<ProtectedRoute><CreateThread /></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute><MarketplaceConnected /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfileConnected /></ProtectedRoute>} />
              <Route path="/elite" element={<Elite />} />
              <Route path="/elite/apply" element={<ProtectedRoute><EliteApply /></ProtectedRoute>} />
              <Route path="/elite/status" element={<ProtectedRoute><EliteStatus /></ProtectedRoute>} />
              <Route path="/elite/premium" element={<ProtectedRoute><ElitePremium /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
              <Route path="/admin/applications" element={<ProtectedRoute><AdminApplications /></ProtectedRoute>} />
              <Route path="/admin/members" element={<ProtectedRoute><AdminMembers /></ProtectedRoute>} />
              <Route path="/admin/investors" element={<ProtectedRoute><AdminInvestors /></ProtectedRoute>} />
              <Route path="/admin/companies" element={<ProtectedRoute><AdminCompanies /></ProtectedRoute>} />
              <Route path="/admin/claims" element={<ProtectedRoute><AdminClaims /></ProtectedRoute>} />
              <Route path="/apply" element={<Apply />} />
              {/* Membership + founder profile (no paywall — these let a founder pay & set up) */}
              <Route path="/membership" element={<ProtectedRoute><Membership /></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
              <Route path="/pipeline" element={<ProtectedRoute><MembershipGate><Pipeline /></MembershipGate></ProtectedRoute>} />
              {/* Members-only (paid): deals and founders */}
              <Route path="/deals" element={<ProtectedRoute><MembershipGate><Deals /></MembershipGate></ProtectedRoute>} />
              <Route path="/deals/new" element={<ProtectedRoute><MembershipGate><DealCreate /></MembershipGate></ProtectedRoute>} />
              <Route path="/deals/:id" element={<ProtectedRoute><MembershipGate><DealDetail /></MembershipGate></ProtectedRoute>} />
              <Route path="/deals/:id/manage" element={<ProtectedRoute><MembershipGate><DealManage /></MembershipGate></ProtectedRoute>} />
              {/* Open to everyone — the directory is the front door for founders raising a round.
                  Contact channels and intro requests inside these pages still require an account.
                  The /in/ place routes must precede /:id so a country slug is never read as a profile. */}
              <Route path="/directory" element={<DirectoryHub />} />
              <Route path="/people/:slug" element={<PersonDetail />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/guides/:slug" element={<GuideDetail />} />
              <Route path="/investors" element={<Investors />} />
              {/* Facet pages. These precede /investors/:id; "type"/"sector" cannot be an entity
                  slug, which always ends in -<8 hex>, so there is no ambiguity. */}
              <Route path="/investors/type/:facet" element={<Investors />} />
              <Route path="/investors/type/:facet/in/:country" element={<Investors />} />
              <Route path="/investors/type/:facet/in/:country/:state" element={<Investors />} />
              <Route path="/investors/type/:facet/in/:country/:state/:city" element={<Investors />} />
              <Route path="/investors/in/:country" element={<Investors />} />
              <Route path="/investors/in/:country/:state" element={<Investors />} />
              <Route path="/investors/in/:country/:state/:city" element={<Investors />} />
              <Route path="/investors/:id" element={<InvestorDetail />} />
              <Route path="/founders" element={<Founders />} />
              <Route path="/founders/sector/:facet" element={<Founders />} />
              <Route path="/founders/sector/:facet/in/:country" element={<Founders />} />
              <Route path="/founders/sector/:facet/in/:country/:state" element={<Founders />} />
              <Route path="/founders/sector/:facet/in/:country/:state/:city" element={<Founders />} />
              <Route path="/founders/in/:country" element={<Founders />} />
              <Route path="/founders/in/:country/:state" element={<Founders />} />
              <Route path="/founders/in/:country/:state/:city" element={<Founders />} />
              {/* /founders/:id is a company from the public record; member founder profiles keep
                  their own route so the two record types never masquerade as each other. */}
              <Route path="/founders/:id" element={<CompanyDetail />} />
              <Route path="/members/:id" element={<FounderDetail />} />

              {/* Protocol Platform Routes */}
              <Route path="/protocol" element={<ProtocolLanding />} />
              <Route path="/protocol/select-role" element={<RoleSelector />} />
              <Route path="/protocol/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/protocol/admin/experts" element={<AdminRoute><ExpertsManagement /></AdminRoute>} />
              <Route path="/protocol/admin/countries" element={<AdminRoute><CountryCAD /></AdminRoute>} />
              <Route path="/protocol/admin/revenue" element={<AdminRoute><AdminRevenue /></AdminRoute>} />
              <Route path="/protocol/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/protocol/expert" element={<ProtectedRoute><ExpertDashboard /></ProtectedRoute>} />
              <Route path="/protocol/expert/students" element={<ProtectedRoute><ExpertStudents /></ProtectedRoute>} />
              <Route path="/protocol/expert/calls" element={<ProtectedRoute><ExpertCalls /></ProtectedRoute>} />
              <Route path="/protocol/expert/feed" element={<ProtectedRoute><ExpertFeed /></ProtectedRoute>} />
              <Route path="/protocol/expert/content" element={<ProtectedRoute><ExpertContent /></ProtectedRoute>} />
              <Route path="/protocol/expert/invites" element={<ProtectedRoute><ExpertInvites /></ProtectedRoute>} />
              <Route path="/protocol/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
              <Route path="/protocol/student/feed" element={<ProtectedRoute><StudentFeed /></ProtectedRoute>} />
              <Route path="/protocol/student/calls" element={<ProtectedRoute><StudentCalls /></ProtectedRoute>} />
              <Route path="/protocol/student/store" element={<ProtectedRoute><StudentStore /></ProtectedRoute>} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
