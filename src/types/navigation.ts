import { PageId, UserRole } from './index';

export type MainNavTabId = 'data-entry' | 'reports' | 'admin' | 'dashboard';

export interface MainNavTabItem {
  id: MainNavTabId;
  labelMarathi: string;
  labelEnglish: string;
  iconName: string;
  defaultPage: PageId;
  descriptionMarathi: string;
}

export const MAIN_NAV_TABS_SUBCENTRE: MainNavTabItem[] = [
  {
    id: 'data-entry',
    labelMarathi: 'Data Entry',
    labelEnglish: 'Data Entry',
    iconName: 'FileEdit',
    defaultPage: 'daily-work',
    descriptionMarathi: 'नोंद करणे / operational काम करणे',
  },
  {
    id: 'reports',
    labelMarathi: 'Reports',
    labelEnglish: 'Reports',
    iconName: 'BarChart3',
    defaultPage: 'reports',
    descriptionMarathi: 'अहवाल पाहणे, Print व Export',
  },
];

export const MAIN_NAV_TABS_PHC_CONTROLLER: MainNavTabItem[] = [
  {
    id: 'data-entry',
    labelMarathi: 'Data Entry',
    labelEnglish: 'Data Entry',
    iconName: 'FileEdit',
    defaultPage: 'daily-work',
    descriptionMarathi: 'नोंद करणे / operational काम करणे',
  },
  {
    id: 'reports',
    labelMarathi: 'Reports',
    labelEnglish: 'Reports',
    iconName: 'BarChart3',
    defaultPage: 'reports',
    descriptionMarathi: 'अहवाल पाहणे, Print व Export',
  },
  {
    id: 'admin',
    labelMarathi: 'Admin',
    labelEnglish: 'Admin',
    iconName: 'ShieldCheck',
    defaultPage: 'phc-master',
    descriptionMarathi: 'मास्टर डेटा, युझर्स व नियंत्रण',
  },
];

export function getMainNavTabsForRole(role?: UserRole): MainNavTabItem[] {
  if (role === 'phc_controller') {
    return MAIN_NAV_TABS_PHC_CONTROLLER;
  }
  return MAIN_NAV_TABS_SUBCENTRE;
}

// Backward compatibility export
export const MAIN_NAV_TABS: MainNavTabItem[] = MAIN_NAV_TABS_PHC_CONTROLLER;

export interface SubNavItem {
  id: PageId;
  labelMarathi: string;
  labelEnglish: string;
  iconName: string;
  badge?: string;
  badgeColor?: string;
  isControllerOnly?: boolean;
  parentTab: MainNavTabId;
}

export const DATA_ENTRY_SUB_ITEMS: SubNavItem[] = [
  {
    id: 'daily-work',
    labelMarathi: '📅 आजचे काम',
    labelEnglish: 'Daily Work & Quick Actions',
    iconName: 'CalendarCheck',
    parentTab: 'data-entry',
  },
  {
    id: 'malaria-register',
    labelMarathi: 'मलेरिया रक्त नमुना नोंद',
    labelEnglish: 'Malaria Blood Sample Register',
    iconName: 'FileSpreadsheet',
    parentTab: 'data-entry',
  },
  {
    id: 'tb-register',
    labelMarathi: 'क्षयरोग (TB) संशयित रुग्ण नोंद',
    labelEnglish: 'TB Suspected Patient Register',
    iconName: 'Activity',
    parentTab: 'data-entry',
  },
  {
    id: 'send-samples',
    labelMarathi: 'नमुने पाठविणे व प्रिंट',
    labelEnglish: 'Send Samples & Print Receipt',
    iconName: 'Send',
    parentTab: 'data-entry',
  },
  {
    id: 'malaria-targets',
    labelMarathi: 'मलेरिया उद्दिष्टे (लक्ष्य)',
    labelEnglish: 'Malaria Target Setting',
    iconName: 'Target',
    parentTab: 'data-entry',
  },
  {
    id: 'offline-drafts',
    labelMarathi: 'Offline Drafts (ऑफलाइन नोंदी)',
    labelEnglish: 'Offline Drafts & Safe Sync',
    iconName: 'CloudOff',
    parentTab: 'data-entry',
  },
  {
    id: 'dynamic-register',
    labelMarathi: 'डिजिटल नोंदवह्या (Dynamic)',
    labelEnglish: 'Dynamic Registers',
    iconName: 'Layers',
    parentTab: 'data-entry',
  },
];

export const REPORTS_SUB_ITEMS: SubNavItem[] = [
  {
    id: 'reports',
    labelMarathi: 'मलेरिया अहवाल (M1/M2)',
    labelEnglish: 'Malaria Reports & Registers',
    iconName: 'BarChart3',
    parentTab: 'reports',
  },
  {
    id: 'malaria-coverage',
    labelMarathi: 'मलेरिया Coverage',
    labelEnglish: 'Malaria Coverage & Performance',
    iconName: 'Target',
    parentTab: 'reports',
    isControllerOnly: true,
  },
  {
    id: 'malaria-targets',
    labelMarathi: 'लक्ष्य व प्रगती अहवाल',
    labelEnglish: 'Target vs Actual Progress Report',
    iconName: 'Flag',
    parentTab: 'reports',
    isControllerOnly: true,
  },
  {
    id: 'tb-reports',
    labelMarathi: 'TB अहवाल',
    labelEnglish: 'TB Reports',
    iconName: 'FileText',
    parentTab: 'reports',
  },
  {
    id: 'dynamic-report',
    labelMarathi: 'डायनॅमिक रजिस्टर अहवाल',
    labelEnglish: 'Dynamic Register Reports',
    iconName: 'FileSpreadsheet',
    parentTab: 'reports',
  },
  {
    id: 'data-validation',
    labelMarathi: 'डेटा गुणवत्ता अहवाल',
    labelEnglish: 'Data Quality & Validation Report',
    iconName: 'ShieldCheck',
    parentTab: 'reports',
    isControllerOnly: true,
  },
];

export const ADMIN_SUB_ITEMS: SubNavItem[] = [
  {
    id: 'phc-master',
    labelMarathi: 'प्रा.आ. केंद्र मास्टर',
    labelEnglish: 'PHC Master',
    iconName: 'Building2',
    isControllerOnly: true,
    parentTab: 'admin',
  },
  {
    id: 'subcentre-master',
    labelMarathi: 'उपकेंद्र मास्टर',
    labelEnglish: 'Subcentre Master',
    iconName: 'Home',
    isControllerOnly: true,
    parentTab: 'admin',
  },
  {
    id: 'village-master',
    labelMarathi: 'गाव मास्टर',
    labelEnglish: 'Village Master',
    iconName: 'MapPin',
    isControllerOnly: true,
    parentTab: 'admin',
  },
  {
    id: 'employee-master',
    labelMarathi: 'कर्मचारी मास्टर',
    labelEnglish: 'Employee Master',
    iconName: 'Users',
    isControllerOnly: true,
    parentTab: 'admin',
  },
  {
    id: 'user-management',
    labelMarathi: 'वापरकर्ता व्यवस्थापन',
    labelEnglish: 'User Management & Roles',
    iconName: 'UserCog',
    isControllerOnly: true,
    parentTab: 'admin',
  },
  {
    id: 'template-builder',
    labelMarathi: 'डायनॅमिक रेकॉर्ड बिल्डर',
    labelEnglish: 'Dynamic Record Builder',
    iconName: 'Wrench',
    isControllerOnly: true,
    parentTab: 'admin',
  },
  {
    id: 'backup-audit',
    labelMarathi: 'Activity / Audit Report',
    labelEnglish: 'System Activity & Audit Log',
    iconName: 'Database',
    isControllerOnly: true,
    parentTab: 'admin',
  },
  {
    id: 'data-migration',
    labelMarathi: 'डेटा Migration',
    labelEnglish: 'Data Migration & Cleanup',
    iconName: 'ServerCrash',
    isControllerOnly: true,
    parentTab: 'admin',
  },
  {
    id: 'sql-query',
    labelMarathi: 'SQL Query Console',
    labelEnglish: 'SQL Query Console',
    iconName: 'Terminal',
    isControllerOnly: true,
    parentTab: 'admin',
  },
];

export function getParentTabForPage(page: PageId, currentTabPreference?: MainNavTabId): MainNavTabId {
  if (page === 'malaria-targets') {
    return currentTabPreference === 'reports' ? 'reports' : 'data-entry';
  }
  if (page === 'template-fields' || page === 'template-builder') {
    return 'admin';
  }
  if (page === 'dynamic-register') {
    return 'data-entry';
  }
  if (page === 'dynamic-report') {
    return 'reports';
  }

  const inAdmin = ADMIN_SUB_ITEMS.some((item) => item.id === page);
  if (inAdmin) return 'admin';

  const inReports = REPORTS_SUB_ITEMS.some((item) => item.id === page);
  if (inReports) return 'reports';

  const inDataEntry = DATA_ENTRY_SUB_ITEMS.some((item) => item.id === page);
  if (inDataEntry) return 'data-entry';

  if (page === 'dashboard') {
    return currentTabPreference || 'data-entry';
  }

  return 'data-entry';
}

