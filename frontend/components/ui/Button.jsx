"use client";

import React from "react";
import styles from "./Button.module.css";

const cx = (...parts) => parts.filter(Boolean).join(" ");

export function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  loading = false,
  iconOnly = false,
  disabled,
  leftIcon,
  rightIcon,
  className,
  children,
  type,
  ...rest
}) {
  const isButton = Comp === "button";
  const isDisabled = Boolean(disabled || loading);

  return (
    <Comp
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        iconOnly && styles.iconOnly,
        className,
      )}
      disabled={isButton ? isDisabled : undefined}
      aria-disabled={!isButton ? isDisabled : undefined}
      data-loading={loading ? "true" : "false"}
      type={isButton ? type ?? "button" : undefined}
      {...rest}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        leftIcon && <span className={styles.icon}>{leftIcon}</span>
      )}
      <span className={cx(styles.label, iconOnly && styles.srOnly)}>
        {children}
      </span>
      {rightIcon && <span className={styles.icon}>{rightIcon}</span>}
    </Comp>
  );
}

