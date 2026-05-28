import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MembershipGate } from "@/components/auth/MembershipGate";
import { BackendHealthBanner } from "@/components/BackendHealthBanner";
import { Skeleton } from "@/components/ui/skeleton";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Forums = lazy(() => import("./pages/Forums"));
const ForumThreads = lazy(() => import("./pages/ForumThreads"));
const ThreadDetail = lazy(() => import("./pages/ThreadDetail"));
const CreateThread = lazy(() => import("./pages/CreateThread"));
const MarketplaceConnected = lazy(() => import("./pages/MarketplaceConnected"));
const ProfileConnected = lazy(() => import("./pages/ProfileConnected"));
const Elite = lazy(() => import("./pages/Elite"));
const EliteApply = lazy(() => import("./pages/EliteApply"));
const EliteStatus = lazy(() => import("./pages/EliteStatus"));
const ElitePremium = lazy(() => import("./pages/ElitePremium"));
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
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin/applications" element={<ProtectedRoute><AdminApplications /></ProtectedRoute>} />
            <Route path="/admin/members" element={<ProtectedRoute><AdminMembers /></ProtectedRoute>} />
            <Route path="/apply" element={<Apply />} />
            {/* Membership + founder profile (no paywall — these let a founder pay & set up) */}
            <Route path="/membership" element={<ProtectedRoute><Membership /></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
            <Route path="/pipeline" element={<ProtectedRoute><MembershipGate><Pipeline /></MembershipGate></ProtectedRoute>} />
            {/* Members-only (paid): deals, investors, founders */}
            <Route path="/deals" element={<ProtectedRoute><MembershipGate><Deals /></MembershipGate></ProtectedRoute>} />
            <Route path="/deals/new" element={<ProtectedRoute><MembershipGate><DealCreate /></MembershipGate></ProtectedRoute>} />
            <Route path="/deals/:id" element={<ProtectedRoute><MembershipGate><DealDetail /></MembershipGate></ProtectedRoute>} />
            <Route path="/deals/:id/manage" element={<ProtectedRoute><MembershipGate><DealManage /></MembershipGate></ProtectedRoute>} />
            <Route path="/investors" element={<ProtectedRoute><MembershipGate><Investors /></MembershipGate></ProtectedRoute>} />
            <Route path="/investors/:id" element={<ProtectedRoute><MembershipGate><InvestorDetail /></MembershipGate></ProtectedRoute>} />
            <Route path="/founders" element={<ProtectedRoute><MembershipGate><Founders /></MembershipGate></ProtectedRoute>} />
            <Route path="/founders/:id" element={<ProtectedRoute><MembershipGate><FounderDetail /></MembershipGate></ProtectedRoute>} />

            {/* Protocol Platform Routes */}
            <Route path="/protocol" element={<ProtocolLanding />} />
            <Route path="/protocol/select-role" element={<RoleSelector />} />
            <Route path="/protocol/admin" element={<AdminDashboard />} />
            <Route path="/protocol/admin/experts" element={<ExpertsManagement />} />
            <Route path="/protocol/admin/countries" element={<CountryCAD />} />
            <Route path="/protocol/admin/revenue" element={<AdminRevenue />} />
            <Route path="/protocol/admin/users" element={<AdminUsers />} />
            <Route path="/protocol/expert" element={<ExpertDashboard />} />
            <Route path="/protocol/expert/students" element={<ExpertStudents />} />
            <Route path="/protocol/expert/calls" element={<ExpertCalls />} />
            <Route path="/protocol/expert/feed" element={<ExpertFeed />} />
            <Route path="/protocol/expert/content" element={<ExpertContent />} />
            <Route path="/protocol/expert/invites" element={<ExpertInvites />} />
            <Route path="/protocol/student" element={<StudentDashboard />} />
            <Route path="/protocol/student/feed" element={<StudentFeed />} />
            <Route path="/protocol/student/calls" element={<StudentCalls />} />
            <Route path="/protocol/student/store" element={<StudentStore />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
