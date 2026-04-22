"use client";

import React from "react";
import styles from "./Input.module.css";

const cx = (...parts) => parts.filter(Boolean).join(" ");

export function Input({
  label,
  helperText,
  error,
  left,
  right,
  className,
  inputClassName,
  id,
  ...rest
}) {
  const autoId = React.useId();
  const inputId = id ?? `input-${autoId}`;
  const describedById = helperText || error ? `${inputId}-help` : undefined;

  return (
    <div className={cx(styles.field, className)}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={cx(styles.control, error && styles.controlError)}>
        {left && <div className={styles.affix}>{left}</div>}
        <input
          id={inputId}
          className={cx(styles.input, inputClassName)}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedById}
          {...rest}
        />
        {right && <div className={styles.affix}>{right}</div>}
      </div>
      {(helperText || error) && (
        <div
          id={describedById}
          className={cx(styles.help, error && styles.helpError)}
        >
          {error ?? helperText}
        </div>
      )}
    </div>
  );
}

