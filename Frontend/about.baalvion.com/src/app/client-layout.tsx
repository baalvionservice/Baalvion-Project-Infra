'use client';
import React from "react";
import { Navbar } from "@/components/navbar";
import { usePathname } from "next/navigation";

const ClientLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
const pathname = usePathname()
const isAdmin = pathname.startsWith('/admin')

  return <div>
    {!isAdmin && <Navbar />}
    {children}</div>;
};

export default ClientLayout;
