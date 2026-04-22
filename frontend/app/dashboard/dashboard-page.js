import dynamic from "next/dynamic";
import { getDashboardMarketData } from "./market-data";
import styles from "./dashboard.module.css";

const MarketCarousel = dynamic(() => import("./market-carousel"), { loading: () => <div className={styles.overviewSection}>Loading Market Data...</div> });
const DashboardOverviewCards = dynamic(() => import("./dashboard-overview-cards"), { loading: () => <div className={styles.overviewSection}>Loading Overview...</div> });

const sectionDescriptions = {
  customers:
    "Create and review customer records with KYC details, uploaded proofs, and onboarding information.",
  loans:
    "Track pledged items, active loan records, repayment schedules, and release activity from one place.",
  transactions:
    "Monitor due amounts, payment status updates, and transaction follow-ups for every active account.",
  reports:
    "Review performance summaries and operational reports prepared for the finance team.",
};

export default async function DashboardPage({ section }) {
  if (section.slug !== "overview") {
    return (
      <div
        aria-label={section.navLabel}
        className={`${styles.emptyCanvas} ${styles.placeholderCanvas}`}
      >
        <article className={styles.placeholderCard}>
          <p className={styles.placeholderEyebrow}>{section.navLabel}</p>
          <h1 className={styles.placeholderTitle}>{section.navLabel} Module</h1>
          <p className={styles.placeholderText}>
            {sectionDescriptions[section.slug] ?? "This section is being prepared for dashboard use."}
          </p>
        </article>
      </div>
    );
  }

  const initialData = await getDashboardMarketData();

  return (
    <div aria-label={section.navLabel} className={`${styles.emptyCanvas} ${styles.dashboardOverview}`}>
      <DashboardOverviewCards />
      <MarketCarousel initialData={initialData} />
    </div>
  );
}
