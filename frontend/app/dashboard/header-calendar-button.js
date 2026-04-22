"use client";

import { useEffect, useRef, useState } from "react";
import chromeStyles from "../chrome.module.css";
import CalendarCard from "../../components/ui/calendar-card";

function CalendarIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <rect height="14" rx="2.5" width="16" x="4" y="6.5" />
      <path d="M8 3.5v4" />
      <path d="M16 3.5v4" />
      <path d="M4 10.5h16" />
      <path d="M9 14.5h.01" />
      <path d="M12 14.5h.01" />
      <path d="M15 14.5h.01" />
    </svg>
  );
}

export default function HeaderCalendarButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className={chromeStyles.headerCalendarWrap} ref={wrapperRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={chromeStyles.headerCalendarIcon}
        onClick={() => setIsOpen((current) => !current)}
        title="Open calendar"
        type="button"
      >
        <CalendarIcon />
      </button>

      {isOpen ? (
        <div className={chromeStyles.headerCalendarPopover} role="dialog">
          <CalendarCard />
        </div>
      ) : null}
    </div>
  );
}
