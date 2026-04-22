"use client";

import React from "react";
import styles from "./Card.module.css";

const cx = (...parts) => parts.filter(Boolean).join(" ");

export function Card({
  title,
  subtitle,
  actions,
  footer,
  children,
  className,
  ...rest
}) {
  const hasHeader = Boolean(title || subtitle || actions);
  return (
    <section className={cx(styles.card, className)} {...rest}>
      {hasHeader && (
        <header className={styles.header}>
          <div className={styles.headerText}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </section>
  );
}

