"use client";

import React, { useEffect, useState } from "react";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [cursorType, setCursorType] = useState<"default" | "link" | "media" | "vote">("default");
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(
        window.matchMedia("(max-width: 768px)").matches ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0
      );
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const clickable = target.closest("a, button, [role='button'], input, select, textarea");
      const cursorAttr = target.closest("[data-cursor]")?.getAttribute("data-cursor");

      if (cursorAttr === "play") {
        setCursorType("media");
      } else if (cursorAttr === "vote") {
        setCursorType("vote");
      } else if (clickable) {
        setCursorType("link");
      } else {
        setCursorType("default");
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [isMobile, isVisible]);

  if (isMobile || !isVisible) return null;

  return (
    <div
      className={`custom-cursor ${
        cursorType === "link"
          ? "hovered-link"
          : cursorType === "media"
          ? "hovered-media"
          : cursorType === "vote"
          ? "hovered-vote"
          : ""
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {cursorType === "media" && (
        <span className="text-[10px] font-black tracking-widest text-[#121212] select-none pointer-events-none">
          PLAY
        </span>
      )}
      {cursorType === "vote" && (
        <span className="text-[10px] font-black tracking-widest text-[#121212] select-none pointer-events-none">
          VOTE
        </span>
      )}
    </div>
  );
}
