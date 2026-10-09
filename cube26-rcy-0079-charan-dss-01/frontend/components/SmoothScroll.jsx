"use client";
import React, { useEffect, useRef, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

const LenisContext = createContext(null);

export const useLenis = () => useContext(LenisContext);

export default function SmoothScroll({ children }) {
  const pathname = usePathname();
  const lenisRef = useRef(null);

  useEffect(() => {
    try {
      const lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth easeOutExpo
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.8,
        infinite: false,
        autoResize: true,
      });

      lenisRef.current = lenis;

      let rafId;
      function raf(time) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);

      // Recompute document scroll limits dynamically when async data or accordions update DOM
      let resizeObserver;
      if (typeof window !== "undefined" && "ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(() => {
          lenis.resize();
        });
        if (document.body) {
          resizeObserver.observe(document.body);
        }
      }

      return () => {
        cancelAnimationFrame(rafId);
        if (resizeObserver) resizeObserver.disconnect();
        lenis.destroy();
        lenisRef.current = null;
      };
    } catch (e) {
      console.warn("Smooth scroll initialization notice:", e);
    }
  }, []);

  // Reset scroll to top on navigation & re-measure dimensions
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
      const timer = setTimeout(() => {
        lenisRef.current?.resize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  );
}
