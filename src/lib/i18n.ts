export type SupportedLanguage = "en" | "ps";

type HeaderCopy = {
  brand: string;
  nav: {
    home: string;
    dashboard: string;
    sessions: string;
    api: string;
    login: string;
    logout: string;
  };
  language: {
    label: string;
    english: string;
    pashto: string;
  };
};

type HomeCopy = {
  heroTagline: string;
  heroTitle: string;
  heroDescription: (context: { email: string; role: string }) => string;
  dashboardButton: string;
  logoutButton: string;
  formPrompt: string;
  tabs: {
    monthly: string;
    hourly: string;
    night: string;
  };
};

type DashboardCopy = {
  tagline: string;
  title: string;
  viewingAs: (role: string) => string;
  backToRegistration: string;
  selectMonth: string;
  viewMonth: string;
  allParkingRevenue: string;
  entries: string;
  monthly: string;
  weekly: string;
  twoWeek: string;
  vehicles: string;
  hourlySessions: string;
  activeSessionsLogged: string;
  nightParking: string;
  staysRecorded: string;
  noVehicles: string;
  driver: string;
  vehicle: string;
  plan: string;
  price: string;
  registered: string;
  expires: string;
  status: string;
  details: string;
  expired: string;
  active: string;
  renew: string;
  pagination: {
    showing: (start: number, end: number, total: number) => string;
    previous: string;
    next: string;
  };
};

type SessionsCopy = {
  tagline: string;
  title: string;
  description: string;
  hourlyTotal: string;
  nightTotal: string;
  grandTotal: string;
  sessions: string;
  allSessions: string;
  activeHourlyVehicles: string;
  noActiveVehicles: string;
  completedHourlySessions: string;
  noHourlySessions: string;
  nightSessions: string;
  noNightSessions: string;
  tableHeaders: {
    vehicle: string;
    rate: string;
    started: string;
    elapsed: string;
    estimated: string;
    billed: string;
    total: string;
    createdBy: string;
    actions: string;
    timestamp: string;
    price: string;
  };
};

type LoginCopy = {
  tagline: string;
  title: string;
  description: string;
  backToHome: string;
};

type UnauthorizedCopy = {
  tagline: string;
  title: string;
  description: string;
  signInPrompt: string;
  returnHome: string;
  goToDashboard: string;
  goToLogin: string;
};

type VehicleDetailCopy = {
  tagline: string;
  plate: string;
  plan: string;
  backToDashboard: string;
  contact: string;
  createdBy: string;
  billing: string;
  subscription: string;
  timeline: string;
  registered: string;
  expires: string;
  notes: string;
  noNotes: string;
};

type LogoutCopy = {
  tagline: string;
  title: string;
  description: string;
  backToHome: string;
};

type Dictionary = {
  header: HeaderCopy;
  home: HomeCopy;
  dashboard: DashboardCopy;
  sessions: SessionsCopy;
  login: LoginCopy;
  unauthorized: UnauthorizedCopy;
  vehicleDetail: VehicleDetailCopy;
  logout: LogoutCopy;
};

const translations: Record<SupportedLanguage, Dictionary> = {
  en: {
    header: {
      brand: "Parking Suite",
      nav: {
        home: "Home",
        dashboard: "Dashboard",
        sessions: "Daily Parking",
        api: "Parking API",
        login: "Login",
        logout: "Logout",
      },
      language: {
        label: "Language",
        english: "English",
        pashto: "Pashto",
      },
    },
    home: {
      heroTagline: "Monthly Parking Registration",
      heroTitle: "Register vehicles for monthly parking",
      heroDescription: ({ email, role }) =>
        `Signed in as ${email} (${role}). Both admins and super admins can submit monthly parking entries.`,
      dashboardButton: "Open dashboard",
      logoutButton: "Logout",
      formPrompt: "Select a plan to open the relevant form.",
      tabs: {
        monthly: "Monthly",
        hourly: "Hourly",
        night: "Night",
      },
    },
    dashboard: {
      tagline: "Dashboard",
      title: "Recent vehicle registrations",
      viewingAs: (role) => `Viewing as ${role}.`,
      backToRegistration: "Back to registration",
      selectMonth: "Select month",
      viewMonth: "View month",
      allParkingRevenue: "All parking revenue",
      entries: "entries",
      monthly: "Monthly",
      weekly: "Weekly",
      twoWeek: "2 Week",
      vehicles: "vehicles",
      hourlySessions: "Hourly sessions",
      activeSessionsLogged: "active sessions logged",
      nightParking: "Night parking",
      staysRecorded: "stays recorded",
      noVehicles: "No vehicles registered yet. Submit one from the home page to see it here.",
      driver: "Driver",
      vehicle: "Vehicle",
      plan: "Plan",
      price: "Price",
      registered: "Registered",
      expires: "Expires",
      status: "Status",
      details: "Details",
      expired: "Expired",
      active: "Active",
      renew: "Renew",
      pagination: {
        showing: (start, end, total) => `Showing ${start}-${end} of ${total}`,
        previous: "Previous",
        next: "Next",
      },
    },
    sessions: {
      tagline: "Daily Parking",
      title: "Hourly & night bookings",
      description: "Track ad-hoc parking sessions. Edit/delete actions are limited to super admins.",
      hourlyTotal: "Hourly total",
      nightTotal: "Night total",
      grandTotal: "Grand total",
      sessions: "session",
      allSessions: "All sessions",
      activeHourlyVehicles: "Active hourly vehicles",
      noActiveVehicles: "No active hourly vehicles.",
      completedHourlySessions: "Completed hourly sessions",
      noHourlySessions: "No hourly sessions recorded yet.",
      nightSessions: "Night sessions",
      noNightSessions: "No night sessions recorded yet.",
      tableHeaders: {
        vehicle: "Vehicle",
        rate: "Rate",
        started: "Started",
        elapsed: "Elapsed",
        estimated: "Estimated",
        billed: "Billed",
        total: "Total (AED)",
        createdBy: "Created by",
        actions: "Actions",
        timestamp: "Timestamp",
        price: "Price (AED)",
      },
    },
    login: {
      tagline: "Authentication",
      title: "Sign in to Parking",
      description: "Pick a role to simulate different access levels in the demo.",
      backToHome: "Back to Home",
    },
    unauthorized: {
      tagline: "Access denied",
      title: "You don't have permission to view that page.",
      description: "Switch to a role that has the right access level and try again. Admins can visit the home screen. Super admins can access both home and the dashboard.",
      signInPrompt: "Need to sign in? Use the login button below.",
      returnHome: "Return home",
      goToDashboard: "Go to dashboard",
      goToLogin: "Go to login",
    },
    vehicleDetail: {
      tagline: "Vehicle detail",
      plate: "Plate",
      plan: "Plan",
      backToDashboard: "Back to dashboard",
      contact: "Contact",
      createdBy: "Created by",
      billing: "Billing",
      subscription: "subscription",
      timeline: "Timeline",
      registered: "Registered",
      expires: "Expires",
      notes: "Notes",
      noNotes: "No additional notes.",
    },
    logout: {
      tagline: "Authentication",
      title: "Sign out of Parking",
      description: "Clear your current role to experience the platform as another user.",
      backToHome: "Back to Home",
    },
  },
  ps: {
    header: {
      brand: "د پارکینګ سویټ",
      nav: {
        home: "کور",
        dashboard: "ډشبورډ",
        sessions: "ورځنی پارکینګ",
        api: "د پارکینګ API",
        login: "ننوتل",
        logout: "وتل",
      },
      language: {
        label: "ژبه",
        english: "انګلیسي",
        pashto: "پښتو",
      },
    },
    home: {
      heroTagline: "میاشتنی پارکینګ ثبتول",
      heroTitle: "موټر د میاشتني پارکینګ لپاره ثبت کړئ",
      heroDescription: ({ email, role }) =>
        `تاسو د ${role} په توګه د ${email} په نوم ننوتلي یاست. هم عادي اډمینان او هم سوپر اډمینان کولی شي میاشتنی پارکینګ ثبت کړي.`,
      dashboardButton: "ډشبورډ پرانیزئ",
      logoutButton: "وتل",
      formPrompt: "د اړوند فورمې د پرانستلو لپاره یو پلان وټاکئ.",
      tabs: {
        monthly: "میاشتنی",
        hourly: "په ساعت کې",
        night: "شپه",
      },
    },
    dashboard: {
      tagline: "ډشبورډ",
      title: "د وروستي موټرو ثبتونه",
      viewingAs: (role) => `د ${role} په توګه کتل کیږي.`,
      backToRegistration: "بیرته ثبتول ته",
      selectMonth: "میاشت وټاکئ",
      viewMonth: "میاشت وګورئ",
      allParkingRevenue: "د پارکینګ ټول عاید",
      entries: "ننوتنې",
      monthly: "میاشتنی",
      weekly: "اونیزه",
      twoWeek: "دوه اونۍ",
      vehicles: "موټرونه",
      hourlySessions: "په ساعت کې ناستې",
      activeSessionsLogged: "فعال ناستې ثبت شوي",
      nightParking: "شپنی پارکینګ",
      staysRecorded: "استوګنې ثبت شوي",
      noVehicles: "تر اوسه هیڅ موټر ثبت نشوی. د کور پاڼې څخه یو ثبت کړئ ترڅو دلته وګورئ.",
      driver: "چلوونکی",
      vehicle: "موټر",
      plan: "پلان",
      price: "قیمت",
      registered: "ثبت شوی",
      expires: "ختمیږي",
      status: "حالت",
      details: "تفصیلات",
      expired: "ختم شوی",
      active: "فعال",
      renew: "بیا نوې کړئ",
      pagination: {
        showing: (start, end, total) => `${start}-${end} د ${total} څخه ښکاره کول`,
        previous: "پخوانی",
        next: "راتلونکی",
      },
    },
    sessions: {
      tagline: "ورځنی پارکینګ",
      title: "په ساعت کې او شپنی ناستې",
      description: "د پارکینګ ناستې تعقیب کړئ. د سمون او حذف کولو عملیات یوازې سوپر اډمینانو ته محدود دي.",
      hourlyTotal: "په ساعت کې ټول",
      nightTotal: "شپه ټول",
      grandTotal: "ټولټال",
      sessions: "ناسته",
      allSessions: "ټولې ناستې",
      activeHourlyVehicles: "فعال موټرونه په ساعت کې",
      noActiveVehicles: "هیڅ فعال موټر په ساعت کې نشته.",
      completedHourlySessions: "بشپړ شوي ناستې په ساعت کې",
      noHourlySessions: "تر اوسه هیڅ ناسته په ساعت کې ثبت نشوې.",
      nightSessions: "شپنی ناستې",
      noNightSessions: "تر اوسه هیڅ شپنی ناسته ثبت نشوې.",
      tableHeaders: {
        vehicle: "موټر",
        rate: "نرخ",
        started: "پیل شو",
        elapsed: "تیر شوی",
        estimated: "اټکل شوی",
        billed: "صورت حساب",
        total: "ټول (AED)",
        createdBy: "جوړ شوی د",
        actions: "عملیات",
        timestamp: "وخت",
        price: "قیمت (AED)",
      },
    },
    login: {
      tagline: "تصدیق",
      title: "په پارکینګ کې ننوځئ",
      description: "د مختلفو لاسرسي کچو د سیمولیشن لپاره یو رول وټاکئ.",
      backToHome: "بیرته کور ته",
    },
    unauthorized: {
      tagline: "لاسرسی رد شو",
      title: "تاسو د دې پاڼې د لیدو اجازه نلرئ.",
      description: "د سمه لاسرسي کچې سره رول ته بدل کړئ او بیا هڅه وکړئ. اډمینان کولی شي د کور سکرین وګوري. سوپر اډمینان کولی شي هم کور او هم ډشبورډ ته لاسرسی ولري.",
      signInPrompt: "ننوتل غواړئ؟ د لاندې د ننوتلو تڼۍ وکاروئ.",
      returnHome: "بیرته کور ته",
      goToDashboard: "ډشبورډ ته لاړ شئ",
      goToLogin: "ننوتل ته لاړ شئ",
    },
    vehicleDetail: {
      tagline: "د موټر تفصیلات",
      plate: "پلیټ",
      plan: "پلان",
      backToDashboard: "بیرته ډشبورډ ته",
      contact: "اړیکه",
      createdBy: "جوړ شوی د",
      billing: "صورت حساب",
      subscription: "ګډون",
      timeline: "وخت لیکه",
      registered: "ثبت شوی",
      expires: "ختمیږي",
      notes: "یادښتونه",
      noNotes: "هیڅ اضافي یادښت نشته.",
    },
    logout: {
      tagline: "تصدیق",
      title: "د پارکینګ څخه ووځئ",
      description: "د اوسني رول پاک کړئ ترڅو د پلیټفارم تجربه د بل کارونکي په توګه وکړئ.",
      backToHome: "بیرته کور ته",
    },
  },
};

export function resolveLanguage(value?: string | null): SupportedLanguage {
  if (value === "ps") {
    return "ps";
  }
  return "en";
}

export function getDictionary(lang: SupportedLanguage): Dictionary {
  return translations[lang];
}
