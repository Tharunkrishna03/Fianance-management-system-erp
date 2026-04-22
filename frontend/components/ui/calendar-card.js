"use client";

import React from 'react';
import styles from './calendar-card.module.css';

export default function CalendarCard() {
  const [activeIndex, setActiveIndex] = React.useState(30);
  const scrollRef = React.useRef(null);
  const [currentVisibleMonth, setCurrentVisibleMonth] = React.useState(new Date().getMonth());
  const [currentVisibleYear, setCurrentVisibleYear] = React.useState(new Date().getFullYear());

  const days = React.useMemo(() => {
    const list = [];
    // Generate dates from 30 days ago to ~1 year ahead
    for (let i = -30; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push({
        dateObj: d,
        dayName: d.toLocaleString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }
    return list;
  }, []);

  // Update visible month correctly based on scroll tracking
  const handleScroll = React.useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    
    // Find the child element closest to the center
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    Array.from(container.children).forEach((child, index) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(childCenter - containerCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    const activeDay = days[closestIndex];
    if (activeDay) {
      if (activeDay.month !== currentVisibleMonth) {
         setCurrentVisibleMonth(activeDay.month);
         setCurrentVisibleYear(activeDay.year);
      }
    }
  }, [days, currentVisibleMonth]);

  // Navigate to specific month clicked from dropdown
  const handleMonthSelect = (monthIndex) => {
    const targetIdx = days.findIndex(d => d.month === monthIndex && d.year === currentVisibleYear);
    // fallback to another year if not found
    const fallbackIdx = targetIdx === -1 ? days.findIndex(d => d.month === monthIndex) : targetIdx;
    
    if (fallbackIdx !== -1 && scrollRef.current) {
      const child = scrollRef.current.children[fallbackIdx];
      if (child) {
        child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  // Center exactly on 'Today' initially
  React.useEffect(() => {
    if (scrollRef.current && scrollRef.current.children[30]) {
      scrollRef.current.children[30].scrollIntoView({ block: 'nearest', inline: 'center' });
    }
  }, []);

  const tempCurrent = new Date(currentVisibleYear, currentVisibleMonth, 1);
  const currentMonthName = tempCurrent.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className={styles.meetingCard}>
      <div className={styles.header} style={{ justifyContent: 'center', marginBottom: '1rem' }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div className={styles.dateSelector} id="month-selector" style={{ position: "relative", overflow: "hidden" }}>
            <select
              value={currentVisibleMonth}
              onChange={(e) => handleMonthSelect(parseInt(e.target.value, 10))}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', appearance: 'none' }}
              title="Select Month"
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const tempDate = new Date();
                tempDate.setMonth(i);
                return (
                  <option key={i} value={i}>
                    {tempDate.toLocaleString("en-US", { month: "long" })}
                  </option>
                );
              })}
            </select>
            <span style={{ pointerEvents: 'none' }}>{currentMonthName}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} fill="currentColor" viewBox="0 0 16 16" style={{ pointerEvents: 'none' }}>
              <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
            </svg>
          </div>
        </div>
      </div>
      <div className={styles.dateNavAndIndicators}>
        <div className={styles.dateNavContainer} ref={scrollRef} onScroll={handleScroll}>
          {days.map((day, idx) => (
            <div 
              key={idx} 
              className={`${styles.dayItem} ${idx === activeIndex ? styles.dayActive : ""}`}
              onClick={() => setActiveIndex(idx)}
            >
              <div className={styles.dayNumber}>{day.dayNumber}</div>
              <div className={styles.dayName}>{day.dayName}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
