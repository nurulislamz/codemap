"use client";

import { useEffect, type RefObject } from "react";

type OutsideClickOptions = {
  active: boolean;
  onOutsideClick: () => void;
  onEscape?: () => void;
};

export function useOutsideClick<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { active, onOutsideClick, onEscape = onOutsideClick }: OutsideClickOptions,
) {
  useEffect(() => {
    if (!active) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;

      if (target && ref.current && !ref.current.contains(target)) {
        onOutsideClick();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onEscape();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, onEscape, onOutsideClick, ref]);
}
