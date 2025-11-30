"use client";

import { useEffect } from "react";

export function PreventZoom() {
  useEffect(() => {
    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Prevent pinch zoom
    const preventPinchZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent zoom on input focus (iOS Safari) - More aggressive approach
    const preventZoomOnFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        // Ensure font size is at least 16px to prevent iOS auto-zoom
        const computedStyle = window.getComputedStyle(target);
        const fontSize = parseFloat(computedStyle.fontSize);
        if (fontSize < 16) {
          target.style.fontSize = "16px";
        }
        
        // Lock viewport immediately
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute(
            "content",
            "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
          );
        }
        
        // Prevent form container zoom
        const formContainer = target.closest("form") || 
                             target.closest(".rounded-2xl") || 
                             target.closest(".rounded-xl") ||
                             target.closest(".rounded-lg");
        if (formContainer) {
          (formContainer as HTMLElement).style.transform = "scale(1)";
          (formContainer as HTMLElement).style.transformOrigin = "top center";
        }
        
        // Store original scroll position
        const scrollY = window.scrollY;
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = "100%";
        document.body.classList.add("input-focused");
        
        // Prevent any zoom attempts
        const preventZoom = () => {
          if (viewport) {
            viewport.setAttribute(
              "content",
              "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
            );
          }
          
          // Keep form container at scale 1
          if (formContainer) {
            (formContainer as HTMLElement).style.transform = "scale(1)";
          }
          
          // Prevent body scroll
          document.body.style.position = "fixed";
          document.body.style.top = `-${scrollY}px`;
          document.body.style.width = "100%";
        };
        
        // Monitor and prevent zoom while focused
        const intervalId = setInterval(preventZoom, 50);
        
        // Store interval ID and scroll position on element for cleanup
        const elementData = target as HTMLElement & { 
          __zoomPreventInterval?: NodeJS.Timeout;
          __scrollY?: number;
        };
        elementData.__zoomPreventInterval = intervalId;
        elementData.__scrollY = scrollY;
      }
    };

    // Prevent horizontal scrolling
    const preventHorizontalScroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollable = target.closest("[data-scrollable]");
      
      // Allow scrolling in specific scrollable containers
      if (scrollable) {
        return;
      }
      
      // Prevent horizontal scroll on body
      if (target === document.body || target === document.documentElement) {
        e.preventDefault();
      }
    };

    // Add event listeners
    document.addEventListener("touchend", preventDoubleTapZoom, {
      passive: false,
    });
    document.addEventListener("touchstart", preventPinchZoom, {
      passive: false,
    });
    document.addEventListener("touchmove", preventHorizontalScroll, {
      passive: false,
    });
    document.addEventListener("focusin", preventZoomOnFocus);

    // Prevent zoom with keyboard
    const preventKeyboardZoom = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "+" || e.key === "-" || e.key === "0" || e.key === "=")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", preventKeyboardZoom);

    // Reset viewport on blur (after input loses focus)
    const resetViewport = (e: FocusEvent) => {
      const target = e.target as HTMLElement & { 
        __zoomPreventInterval?: NodeJS.Timeout;
        __scrollY?: number;
      };
      
      // Clear interval if it exists
      if (target.__zoomPreventInterval) {
        clearInterval(target.__zoomPreventInterval);
        delete target.__zoomPreventInterval;
      }
      
      // Restore body scroll
      const scrollY = target.__scrollY ?? 0;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.classList.remove("input-focused");
      window.scrollTo(0, scrollY);
      
      // Reset form container transform
      const formContainer = target.closest("form") || 
                           target.closest(".rounded-2xl") || 
                           target.closest(".rounded-xl") ||
                           target.closest(".rounded-lg");
      if (formContainer) {
        (formContainer as HTMLElement).style.transform = "";
        (formContainer as HTMLElement).style.transformOrigin = "";
      }
      
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute(
          "content",
          "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
        );
      }
    };

    document.addEventListener("focusout", resetViewport);

    // Additional prevention: Monitor viewport changes and reset immediately
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      const observer = new MutationObserver(() => {
        const currentContent = viewport.getAttribute("content");
        if (
          currentContent &&
          (!currentContent.includes("maximum-scale=1.0") ||
            !currentContent.includes("user-scalable=no"))
        ) {
          viewport.setAttribute(
            "content",
            "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
          );
        }
      });

      observer.observe(viewport, {
        attributes: true,
        attributeFilter: ["content"],
      });

      // Cleanup observer on unmount
      return () => {
        observer.disconnect();
        document.removeEventListener("touchend", preventDoubleTapZoom);
        document.removeEventListener("touchstart", preventPinchZoom);
        document.removeEventListener("touchmove", preventHorizontalScroll);
        document.removeEventListener("focusin", preventZoomOnFocus);
        document.removeEventListener("focusout", resetViewport);
        document.removeEventListener("keydown", preventKeyboardZoom);
      };
    }

    return () => {
      document.removeEventListener("touchend", preventDoubleTapZoom);
      document.removeEventListener("touchstart", preventPinchZoom);
      document.removeEventListener("touchmove", preventHorizontalScroll);
      document.removeEventListener("focusin", preventZoomOnFocus);
      document.removeEventListener("focusout", resetViewport);
      document.removeEventListener("keydown", preventKeyboardZoom);
    };
  }, []);

  return null;
}

