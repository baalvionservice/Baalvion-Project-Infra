"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { useViewRole } from "@/hooks/use-view-role";
import AdminView from "./admin-view";
import InvestorView from "./investor-view";
import CoFounderView from "./co-founder-view";
import EmployeeView from "./employee-view";

function DashboardContent() {
  const { role: currentRole } = useViewRole();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  switch (currentRole) {
    case "INVESTOR":
      return <InvestorView />;
    case "CO_FOUNDER":
      return <CoFounderView />;
    case "EMPLOYEE":
      return <EmployeeView />;
    default:
      return <AdminView />;
  }
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
