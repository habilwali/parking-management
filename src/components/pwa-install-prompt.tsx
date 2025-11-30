"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Detect if user is on mobile device
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent
  );
}

// Detect iOS Safari
function isIOSSafari(): boolean {
  if (typeof window === "undefined") return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
  
  return isIOS && isSafari;
}

// Detect Android Chrome
function isAndroidChrome(): boolean {
  if (typeof window === "undefined") return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/.test(userAgent) && /chrome/.test(userAgent);
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showMobileBanner, setShowMobileBanner] = useState(false);
  const [showDesktopPrompt, setShowDesktopPrompt] = useState(false);
  // Check if user dismissed the prompt (stored in localStorage)
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pwa-install-dismissed") === "true";
    }
    return false;
  });

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      // Use native install prompt if available
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        toast.success("Installing Parking App...");
        setShowMobileBanner(false);
        setShowDesktopPrompt(false);
      }

      setDeferredPrompt(null);
    } else {
      // Show instructions for mobile
      const isIOS = isIOSSafari();
      const isAndroid = isAndroidChrome();
      
      if (isIOS) {
        toast.info("Install Instructions", {
          description: "Tap Share → Add to Home Screen → Add",
          duration: 10000,
        });
      } else if (isAndroid) {
        toast.info("Install Instructions", {
          description: "Tap menu (⋮) → Add to Home screen → Install",
          duration: 10000,
        });
      } else {
        toast.info("Install Instructions", {
          description: "Use your browser menu to add this app to your home screen",
          duration: 10000,
        });
      }
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowMobileBanner(false);
    setShowDesktopPrompt(false);
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("pwa-install-dismissed", "true");
    }
  }, []);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone || dismissed) {
      return;
    }

    const isMobile = isMobileDevice();

    // Show mobile banner immediately for mobile devices
    if (isMobile) {
      const timer = setTimeout(() => {
        setShowMobileBanner(true);
      }, 2000); // Show after 2 seconds
      
      return () => clearTimeout(timer);
    }

    // For desktop, wait for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      setTimeout(() => {
        setShowDesktopPrompt(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [dismissed]);

  // Show mobile banner when beforeinstallprompt fires on mobile
  useEffect(() => {
    if (deferredPrompt && isMobileDevice() && !dismissed) {
      // Use setTimeout to avoid synchronous setState
      const timer = setTimeout(() => {
        setShowMobileBanner(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt, dismissed]);

  // Mobile banner notification
  if (showMobileBanner && !dismissed) {
    const isIOS = isIOSSafari();
    const isAndroid = isAndroidChrome();

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card shadow-lg sm:hidden">
        <div className="mx-auto max-w-md p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 rounded-full bg-primary/10 p-2">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                Install Parking App
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {isIOS
                  ? "Tap Share → Add to Home Screen"
                  : isAndroid
                    ? "Tap menu (⋮) → Add to Home screen"
                    : "Add to Home screen for quick access"}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Install Now
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="outline"
            >
              Later
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop prompt banner
  if (showDesktopPrompt && deferredPrompt && !dismissed) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border bg-card p-4 shadow-lg sm:left-auto">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Install Parking App
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Install our app for a better experience. Quick access, offline
              support, and more.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            onClick={handleInstall}
            size="sm"
            className="flex-1"
          >
            Install
          </Button>
          <Button
            onClick={handleDismiss}
            size="sm"
            variant="outline"
          >
            Later
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
