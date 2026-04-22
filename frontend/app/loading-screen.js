"use client";

import styles from "./loading-screen.module.css";

export default function LoadingScreen({ label = "Loading..." }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.loader} aria-hidden="true">
        <span className={styles.loaderRing} />
        <span className={styles.loaderRing} />
        <span className={styles.loaderCore} />
      </div>
      {label ? <p className={styles.label}>{label}</p> : null}
    </div>
  );
}
