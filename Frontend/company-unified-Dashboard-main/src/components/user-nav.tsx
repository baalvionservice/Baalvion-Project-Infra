"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CreditCard,
  LogOut,
  Settings,
  User,
  Users,
  BookOpen,
  LogIn,
} from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  getCurrentUser,
  logout,
  isAuthenticated,
  getUserRole,
  setCurrentUser,
} from "@/lib/auth";
import type { Role, User as UserType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function UserNav() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUserState] = useState<UserType | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>("ADMIN");
  const [mounted, setMounted] = useState(false);

  const roles: Role[] = ["ADMIN", "INVESTOR", "CO_FOUNDER", "EMPLOYEE"];

  useEffect(() => {
    setMounted(true);
    const user = getCurrentUser();
    const role = getUserRole();
    setCurrentUserState(user);
    setCurrentRole(role || "ADMIN");
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated() || !currentUser) {
    return (
      <Button variant="ghost" onClick={() => router.push("/auth/login")}>
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Button>
    );
  }

  const userImage = PlaceHolderImages.find(
    (img) => img.id === currentUser.imageId
  );

  const handleRoleChange = (role: string) => {
    const newRole = role as Role;

    // Update the user's role in localStorage
    const updatedUser = { ...currentUser, role: newRole };
    setCurrentUser(updatedUser);
    setCurrentUserState(updatedUser);
    setCurrentRole(newRole);

    toast({
      title: "Role switched",
      description: `Switched to ${newRole.replace("_", " ")} view`,
    });

    // Refresh the dashboard to show the new role view
    router.refresh();
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been signed out of your account",
    });
    router.push("/auth/login");
  };

  const handleTour = () => {
    localStorage.removeItem("baalvion_tour_completed");
    window.dispatchEvent(new CustomEvent("start-tour"));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            {userImage && (
              <AvatarImage
                src={userImage.imageUrl}
                alt={currentUser.name}
                data-ai-hint={userImage.imageHint}
              />
            )}
            <AvatarFallback>
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {currentUser.name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {currentUser.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              Role: {currentRole.replace("_", " ")}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Users className="mr-2 h-4 w-4" />
              <span>Switch Role</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={currentRole}
                  onValueChange={handleRoleChange}
                >
                  {roles.map((role) => (
                    <DropdownMenuRadioItem key={role} value={role}>
                      {role.charAt(0) +
                        role.slice(1).toLowerCase().replace(/_/g, "-")}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={handleTour}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Take a Tour</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
