import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const checkThrottleRef = useRef<number>(0);
  const lastElementRef = useRef<HTMLElement | null>(null);
  const lastCheckResultRef = useRef<{ clickable: boolean; textInput: boolean }>({ clickable: false, textInput: false });

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let rafId: number | null = null;
    let mouseX = 0;
    let mouseY = 0;
    const CHECK_THROTTLE = 100; // Check element type every 100ms

    const updatePosition = () => {
      if (cursor) {
        cursor.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%))`;
      }
      rafId = null;
    };

    const checkElementType = (target: HTMLElement): { clickable: boolean; textInput: boolean } => {
      const now = Date.now();
      
      // Use cached result if same element and within throttle
      if (target === lastElementRef.current && (now - checkThrottleRef.current) < CHECK_THROTTLE) {
        return lastCheckResultRef.current;
      }

      checkThrottleRef.current = now;
      lastElementRef.current = target;

      // Fast checks only
      const tagName = target.tagName;
      const clickable = !!(
        tagName === "BUTTON" ||
        tagName === "A" ||
        target.getAttribute("role") === "button" ||
        target.classList.contains("cursor-pointer")
      );

      const textInput = !!(
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        target.hasAttribute("contenteditable")
      );

      const result = { clickable, textInput };
      lastCheckResultRef.current = result;
      return result;
    };

    const updateCursor = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Update position immediately via RAF (no React state)
      if (rafId === null) {
        rafId = requestAnimationFrame(updatePosition);
      }

      // Throttled element type check and class update
      const checkResult = checkElementType(e.target as HTMLElement);
      
      // Direct DOM manipulation to avoid React re-renders
      cursor.classList.toggle("clickable", checkResult.clickable);
      cursor.classList.toggle("text-cursor", checkResult.textInput);
      cursor.style.display = "block";
    };

    const handleMouseLeave = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (cursor) {
        cursor.style.display = "none";
      }
      lastElementRef.current = null;
    };

    window.addEventListener("mousemove", updateCursor, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    // Initial hide
    if (cursor) {
      cursor.style.display = "none";
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("mousemove", updateCursor);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="custom-cursor"
    >
      <div className="custom-cursor-dot" />
    </div>
  );
}
