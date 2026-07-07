import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const VIEWPORT_GAP = 8;
const TOOLTIP_GAP = 8;
const SHOW_DELAY_MS = 120;

function assignRef(targetRef, value) {
  if (typeof targetRef === "function") {
    targetRef(value);
    return;
  }

  if (targetRef) {
    targetRef.current = value;
  }
}

function callHandler(handler, event) {
  if (typeof handler === "function") {
    handler(event);
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getPreferredPlacement(triggerElement) {
  return triggerElement?.closest?.(".board-topbar") ? "bottom" : "top";
}

export const Tooltip = forwardRef(function Tooltip(
  {
    as: Component = "span",
    label,
    className = "",
    children,
    onBlur,
    onFocus,
    onMouseEnter,
    onMouseLeave,
    ...props
  },
  ref,
) {
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const showTimerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, placement: "top" });
  const tooltipClassName = ["ui-tooltip", className].filter(Boolean).join(" ");

  const setTriggerRef = (element) => {
    triggerRef.current = element;
    assignRef(ref, element);
  };

  function clearShowTimer() {
    if (showTimerRef.current) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }

  function showTooltip() {
    if (!label) {
      return;
    }

    clearShowTimer();
    showTimerRef.current = window.setTimeout(() => {
      setIsVisible(true);
      showTimerRef.current = null;
    }, SHOW_DELAY_MS);
  }

  function hideTooltip() {
    clearShowTimer();
    setIsVisible(false);
  }

  function updatePosition() {
    const triggerElement = triggerRef.current;
    const tooltipElement = tooltipRef.current;

    if (!triggerElement || !tooltipElement) {
      return;
    }

    const triggerRect = triggerElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const preferredPlacement = getPreferredPlacement(triggerElement);
    const canPlaceTop = triggerRect.top >= tooltipRect.height + TOOLTIP_GAP + VIEWPORT_GAP;
    const canPlaceBottom = window.innerHeight - triggerRect.bottom >= tooltipRect.height + TOOLTIP_GAP + VIEWPORT_GAP;
    let placement = preferredPlacement;

    if (placement === "top" && !canPlaceTop && canPlaceBottom) {
      placement = "bottom";
    }

    if (placement === "bottom" && !canPlaceBottom && canPlaceTop) {
      placement = "top";
    }

    const centeredLeft = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    const maxLeft = Math.max(VIEWPORT_GAP, window.innerWidth - tooltipRect.width - VIEWPORT_GAP);
    const left = clamp(centeredLeft, VIEWPORT_GAP, maxLeft);
    const top = placement === "bottom"
      ? triggerRect.bottom + TOOLTIP_GAP
      : triggerRect.top - tooltipRect.height - TOOLTIP_GAP;

    setPosition({ left, top: Math.max(VIEWPORT_GAP, top), placement });
  }

  useLayoutEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    updatePosition();
    const frameId = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(frameId);
  }, [isVisible, label]);

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isVisible]);

  useEffect(() => () => clearShowTimer(), []);

  const trigger = (
    <Component
      ref={setTriggerRef}
      className={tooltipClassName}
      onBlur={(event) => {
        callHandler(onBlur, event);
        hideTooltip();
      }}
      onFocus={(event) => {
        callHandler(onFocus, event);
        showTooltip();
      }}
      onMouseEnter={(event) => {
        callHandler(onMouseEnter, event);
        showTooltip();
      }}
      onMouseLeave={(event) => {
        callHandler(onMouseLeave, event);
        hideTooltip();
      }}
      {...props}
    >
      {children}
    </Component>
  );

  if (!isVisible || !label || typeof document === "undefined") {
    return trigger;
  }

  return (
    <>
      {trigger}
      {createPortal(
        <span
          ref={tooltipRef}
          className={`ui-tooltip-layer ui-tooltip-layer--${position.placement}`}
          style={{ left: `${position.left}px`, top: `${position.top}px` }}
          role="tooltip"
        >
          {label}
          <span className="ui-tooltip-layer__arrow" aria-hidden="true" />
        </span>,
        document.body,
      )}
    </>
  );
});
