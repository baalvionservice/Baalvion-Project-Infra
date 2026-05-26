"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import businessesData from "@/lib/data/businesses";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import AddBusinessModal from "./add-business-modal";
import { format } from "date-fns";
import limits from "@/lib/data/limits.json";
import UpgradeModal from "@/components/upgrade-modal";

export default function BusinessManagement() {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const handleAddBusinessClick = () => {
    // Assuming current plan is 'Pro' for demonstration
    if (businessesData.length >= limits.pro.businesses) {
      setUpgradeModalOpen(true);
    } else {
      setAddModalOpen(true);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Management</CardTitle>
              <CardDescription>
                Manage your portfolio of businesses.
              </CardDescription>
            </div>
            <Button onClick={handleAddBusinessClick}>
              <PlusCircle className="mr-2" /> Add Business
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {businessesData.map((biz) => {
            const image = PlaceHolderImages.find((p) => p.id === biz.imageId);
            return (
              <Card key={biz.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {image && <AvatarImage src={image.imageUrl} />}
                      <AvatarFallback>{biz.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{biz.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {biz.country}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Archive</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Created:</span>{" "}
                    <span className="font-medium">
                      {format(new Date(), "PP")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan Tier:</span>{" "}
                    <Badge variant="outline">Enterprise</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>{" "}
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      {biz.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
      <AddBusinessModal
        isOpen={isAddModalOpen}
        onOpenChange={setAddModalOpen}
      />
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
      />
    </>
  );
}
