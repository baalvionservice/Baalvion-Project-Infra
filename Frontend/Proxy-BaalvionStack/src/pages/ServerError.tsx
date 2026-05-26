import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function ServerError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-destructive mb-4">500</h1>
        <p className="text-xl text-muted-foreground mb-8">Something went wrong on our end. Please try again.</p>
        <div className="flex gap-3 justify-center">
          <Button variant="hero" onClick={() => window.location.reload()}><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
          <Button variant="outline" asChild><Link to="/">Go Home</Link></Button>
        </div>
      </div>
    </div>
  );
}
