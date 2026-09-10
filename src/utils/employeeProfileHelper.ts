import { CurrentUserContext } from '../services/currentUserService';
import { UserProfile } from '../types';

export interface EmployeeProfileDisplay {
  hasProfile: boolean;
  employeeName: string;
  greeting: string;
  designation?: string;
  subcentreName?: string;
  phcName?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_AVAILABLE_TEXT = 'कर्मचारी माहिती उपलब्ध नाही';

/**
 * Extracts and validates the real employee information for display.
 * Strictly adheres to:
 * - Real employee data sourced from: Supabase Auth → user_profiles → employee_master
 * - Header/Home screen shows: "नमस्कार, [Actual Employee Name]"
 * - Below it optionally shows: पद and प्राथमिक उपकेंद्र
 * - Do NOT show: Demo User, PHC Controller, Role Switcher, Fake Employee Name, UUID, Technical IDs, or system noise
 * - If employee profile cannot be loaded, returns "कर्मचारी माहिती उपलब्ध नाही"
 * - Do NOT substitute a demo/default employee
 */
export function getEmployeeProfileDisplay(
  userContext?: CurrentUserContext | null,
  user?: UserProfile | null
): EmployeeProfileDisplay {
  // 1. Authoritative chain: Supabase Auth -> user_profiles -> employee_master
  // Candidate name priority:
  // - userContext.employeeName (directly populated from employee_master.employee_name)
  // - user.marathiName
  // - user.name
  const candidate = (
    userContext?.employeeName ||
    user?.marathiName ||
    user?.name ||
    ''
  ).trim();

  // If candidate is empty or missing
  if (!candidate) {
    return {
      hasProfile: false,
      employeeName: NOT_AVAILABLE_TEXT,
      greeting: NOT_AVAILABLE_TEXT,
    };
  }

  // Reject UUID strings
  if (UUID_REGEX.test(candidate)) {
    return {
      hasProfile: false,
      employeeName: NOT_AVAILABLE_TEXT,
      greeting: NOT_AVAILABLE_TEXT,
    };
  }

  // Reject email addresses, technical identifiers, or system tokens
  if (
    candidate.includes('@') ||
    candidate.startsWith('usr_') ||
    candidate.startsWith('emp_') ||
    candidate.startsWith('sc_') ||
    candidate.startsWith('phc_') ||
    candidate.startsWith('id_')
  ) {
    return {
      hasProfile: false,
      employeeName: NOT_AVAILABLE_TEXT,
      greeting: NOT_AVAILABLE_TEXT,
    };
  }

  // Reject demo and placeholder strings
  const lower = candidate.toLowerCase();
  if (
    lower.includes('demo') ||
    candidate.includes('डेमो') ||
    lower === 'user' ||
    lower === 'employee' ||
    candidate === 'कर्मचारी' ||
    candidate === 'आरोग्य कर्मचारी' ||
    candidate === 'वापरकर्ता' ||
    lower.includes('controller') ||
    candidate.includes('नियंत्रक') ||
    lower.includes('admin') ||
    candidate.includes('ॲडमिन')
  ) {
    return {
      hasProfile: false,
      employeeName: NOT_AVAILABLE_TEXT,
      greeting: NOT_AVAILABLE_TEXT,
    };
  }

  // Reject hardcoded demo mock user substitutions (e.g. mock demo IDs)
  const isMockDemoUser =
    (user?.id === 'c2000000-0000-4000-8000-000000000002' ||
      user?.authUserId === '550e8400-e29b-41d4-a716-446655440102') &&
    !userContext?.employeeId;

  if (isMockDemoUser) {
    return {
      hasProfile: false,
      employeeName: NOT_AVAILABLE_TEXT,
      greeting: NOT_AVAILABLE_TEXT,
    };
  }

  // Resolve Designation (पद) - optional
  let designation = (
    userContext?.designation ||
    user?.roleTitleMarathi ||
    ''
  ).trim();

  if (
    designation.toLowerCase().includes('demo') ||
    designation.includes('डेमो') ||
    designation.includes('नियंत्रक') ||
    UUID_REGEX.test(designation) ||
    designation.includes('@') ||
    designation === 'वापरकर्ता' ||
    designation === 'कर्मचारी'
  ) {
    designation = '';
  }

  // Resolve Subcentre (प्राथमिक उपकेंद्र) - optional
  let subcentreName = (
    userContext?.subcentreName ||
    user?.assignedSubcentre ||
    ''
  ).trim();

  if (
    subcentreName.toLowerCase().includes('demo') ||
    subcentreName.includes('डेमो') ||
    subcentreName.includes('सर्व उपकेंद्रे') ||
    UUID_REGEX.test(subcentreName) ||
    subcentreName.includes('@') ||
    subcentreName === 'आरोग्य उपकेंद्र'
  ) {
    subcentreName = '';
  }

  // Resolve PHC Name if present
  let phcName = (
    userContext?.phcName ||
    user?.assignedPhc ||
    ''
  ).trim();

  if (UUID_REGEX.test(phcName) || phcName.includes('@')) {
    phcName = '';
  }

  return {
    hasProfile: true,
    employeeName: candidate,
    greeting: `नमस्कार, ${candidate}`,
    designation: designation || undefined,
    subcentreName: subcentreName || undefined,
    phcName: phcName || undefined,
  };
}
