"use client";

import { useEffect, useRef, type RefObject } from "react";

type OutsideClickOptions = {
  active: boolean;
  onOutsideClick: () => void;
  onEscape?: () => void;
};

export function useOutsideClick<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { active, onOutsideClick, onEscape = onOutsideClick }: OutsideClickOptions,
) {
  const onOutsideClickRef = useRef(onOutsideClick);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onOutsideClickRef.current = onOutsideClick;
    onEscapeRef.current = onEscape;
  }, [onEscape, onOutsideClick]);

  useEffect(() => {
    if (!active) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;

      if (target && ref.current && !ref.current.contains(target)) {
        onOutsideClickRef.current();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onEscapeRef.current();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, ref]);
}
