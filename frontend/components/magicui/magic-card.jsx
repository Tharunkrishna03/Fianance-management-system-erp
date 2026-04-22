"use client";

import styles from "./magic-card.module.css";

const cx = (...parts) => parts.filter(Boolean).join(" ");

export function MagicCard({
  as: Component = "div",
  className,
  onPointerLeave,
  onPointerMove,
  style,
  ...props
}) {
  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--magic-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--magic-y", `${event.clientY - bounds.top}px`);
    onPointerMove?.(event);
  };

  const handlePointerLeave = (event) => {
    event.currentTarget.style.setProperty("--magic-x", "50%");
    event.currentTarget.style.setProperty("--magic-y", "50%");
    onPointerLeave?.(event);
  };

  return (
    <Component
      className={cx(styles.magicCard, className)}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={style}
      {...props}
    />
  );
}
