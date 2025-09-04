import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import KioskPage from "@/pages/kiosk";
import ManagerPage from "@/pages/manager";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tablet, BarChart3, Settings } from "lucide-react";

type AppMode = "kiosk" | "manager" | "admin";

function ModeSelector({ currentMode, onModeChange }: { currentMode: AppMode; onModeChange: (mode: AppMode) => void }) {
  return (
    <nav className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-reverse space-x-4">
            <h1 className="text-xl font-bold text-foreground">מערכת נוכחות</h1>
            <span className="text-sm text-muted-foreground hidden sm:inline">בית ספר דמו</span>
          </div>
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="bg-muted rounded-lg p-1 hidden md:flex">
              <Button
                variant={currentMode === "kiosk" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("kiosk")}
                className="text-sm"
                data-testid="button-kiosk-mode"
              >
                <Tablet className="ml-2 h-4 w-4" />
                קיוסק תלמידים
              </Button>
              <Button
                variant={currentMode === "manager" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("manager")}
                className="text-sm"
                data-testid="button-manager-mode"
              >
                <BarChart3 className="ml-2 h-4 w-4" />
                ניהול נוכחות
              </Button>
              <Button
                variant={currentMode === "admin" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("admin")}
                className="text-sm"
                data-testid="button-admin-mode"
              >
                <Settings className="ml-2 h-4 w-4" />
                ניהול מערכת
              </Button>
            </div>

            {(currentMode === "manager" || currentMode === "admin") && (
              <div className="hidden manager-only admin-only items-center space-x-reverse space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">שרה כהן</p>
                  <p className="text-xs text-muted-foreground">אחראית נוכחות</p>
                </div>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">ש</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function MobileModeSelector({ currentMode, onModeChange }: { currentMode: AppMode; onModeChange: (mode: AppMode) => void }) {
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
      <div className="bg-card rounded-lg shadow-lg border border-border p-2">
        <div className="flex space-x-reverse space-x-1">
          <Button
            variant={currentMode === "kiosk" ? "default" : "ghost"}
            className="flex-1 flex flex-col items-center py-3 h-auto"
            onClick={() => onModeChange("kiosk")}
            data-testid="button-mobile-kiosk"
          >
            <Tablet className="h-5 w-5 mb-1" />
            <span className="text-xs">קיוסק</span>
          </Button>
          <Button
            variant={currentMode === "manager" ? "default" : "ghost"}
            className="flex-1 flex flex-col items-center py-3 h-auto"
            onClick={() => onModeChange("manager")}
            data-testid="button-mobile-manager"
          >
            <BarChart3 className="h-5 w-5 mb-1" />
            <span className="text-xs">נוכחות</span>
          </Button>
          <Button
            variant={currentMode === "admin" ? "default" : "ghost"}
            className="flex-1 flex flex-col items-center py-3 h-auto"
            onClick={() => onModeChange("admin")}
            data-testid="button-mobile-admin"
          >
            <Settings className="h-5 w-5 mb-1" />
            <span className="text-xs">ניהול</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Router() {
  const [currentMode, setCurrentMode] = useState<AppMode>("kiosk");

  const renderCurrentInterface = () => {
    switch (currentMode) {
      case "kiosk":
        return <KioskPage />;
      case "manager":
        return <ManagerPage />;
      case "admin":
        return <AdminPage />;
      default:
        return <KioskPage />;
    }
  };

  return (
    <div className="min-h-screen" dir="rtl">
      <ModeSelector currentMode={currentMode} onModeChange={setCurrentMode} />
      {renderCurrentInterface()}
      <MobileModeSelector currentMode={currentMode} onModeChange={setCurrentMode} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
