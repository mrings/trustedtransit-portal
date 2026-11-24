// Small, consistent stroke-based icon set (24x24, currentColor) — no icon-library dependency.
const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const IconDashboard = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

export const IconRoute = (p) => (
  <svg {...base} {...p}>
    <circle cx="6" cy="19" r="2.2" />
    <circle cx="18" cy="5" r="2.2" />
    <path d="M6 16.8V13a4 4 0 0 1 4-4h4a4 4 0 0 0 4-4V7.2" />
  </svg>
);

export const IconUsers = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" />
    <circle cx="17.5" cy="8.5" r="2.4" />
    <path d="M15.5 14.3c2.6.2 4.7 2.6 4.7 5.7" />
  </svg>
);

export const IconCar = (p) => (
  <svg {...base} {...p}>
    <path d="M4 16V12l2-5h12l2 5v4" />
    <path d="M3 16h18v2.2A1.8 1.8 0 0 1 19.2 20h-.4a1.8 1.8 0 0 1-1.8-1.8V17H7v1.2A1.8 1.8 0 0 1 5.2 20h-.4A1.8 1.8 0 0 1 3 18.2V16Z" />
    <circle cx="7.5" cy="16" r="0.2" />
    <circle cx="16.5" cy="16" r="0.2" />
  </svg>
);

export const IconSettings = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3.5v2.3M12 18.2v2.3M4.9 6.1l1.6 1.6M17.5 16.3l1.6 1.6M3.5 12h2.3M18.2 12h2.3M4.9 17.9l1.6-1.6M17.5 7.7l1.6-1.6" />
  </svg>
);

export const IconCreditCard = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <path d="M6.5 14.5h4" />
  </svg>
);

export const IconShield = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 19 6v6c0 4.5-3.2 7.3-7 8.5-3.8-1.2-7-4-7-8.5V6l7-2.5Z" />
    <path d="M9.3 12.2l1.9 1.9 3.6-3.9" />
  </svg>
);

export const IconLogout = (p) => (
  <svg {...base} {...p}>
    <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
    <path d="M14 8l4 4-4 4" />
    <path d="M18 12H9" />
  </svg>
);

export const IconPlus = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconCalendar = (p) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </svg>
);

export const IconCheckCircle = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.3 12.3l2.4 2.4 5-5.4" />
  </svg>
);

export const IconMapPin = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21s7-6.8 7-11.5a7 7 0 1 0-14 0C5 14.2 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.4" />
  </svg>
);
