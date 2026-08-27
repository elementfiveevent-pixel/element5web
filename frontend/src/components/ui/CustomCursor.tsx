"use client";

import React, { useEffect, useRef, useCallback } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorTypeRef = useRef<"default" | "link" | "media" | "vote">("default");
  const visibleRef = useRef(false);
  const isMobileRef = useRef(true);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    const checkDevice = () => {
      isMobileRef.current =
        window.matchMedia("(max-width: 768px)").matches ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0;
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    if (isMobileRef.current) {
      setMounted(false);
      return () => window.removeEventListener("resize", checkDevice);
    }

    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
        if (!visibleRef.current) {
          visibleRef.current = true;
          cursorRef.current.style.opacity = "1";
        }
      }
    };

    const handleMouseLeave = () => {
      visibleRef.current = false;
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "0";
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const clickable = target.closest("a, button, [role='button'], input, select, textarea");
      const cursorAttr = target.closest("[data-cursor]")?.getAttribute("data-cursor");

      let newType: "default" | "link" | "media" | "vote" = "default";
      if (cursorAttr === "play") {
        newType = "media";
      } else if (cursorAttr === "vote") {
        newType = "vote";
      } else if (clickable) {
        newType = "link";
      }

      if (newType !== cursorTypeRef.current) {
        cursorTypeRef.current = newType;
        if (cursorRef.current) {
          cursorRef.current.className = `custom-cursor ${
            newType === "link"
              ? "hovered-link"
              : newType === "media"
              ? "hovered-media"
              : newType === "vote"
              ? "hovered-vote"
              : ""
          }`;
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mouseover", handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      ref={cursorRef}
      className="custom-cursor"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        opacity: 0,
        pointerEvents: "none",
        willChange: "transform",
      }}
    />
  );
}
