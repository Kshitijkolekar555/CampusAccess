/**
 * Centralized Validation & Input Normalization Engine for CampusAccess
 */

export const INDIAN_PHONE_REGEX = /^[6-9][0-9]{9}$/;
export const INDIAN_VEHICLE_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/;
export const PASSWORD_STRENGTH_REGEX = /^.{6,}$/;
export const NAME_REGEX = /^[a-zA-Z\s.']{2,150}$/;
export const PRN_REGEX = /^[A-Z0-9]{8,20}$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const MEANINGLESS_INPUTS = new Set([
  'abc', 'test', 'aaa', '123', 'asdf', 'qwer', 'xyz', 'temp', 'n/a', 'na', 'null', 'none', '...'
]);

/**
 * Normalizes Indian Phone Numbers by stripping +91, spaces, hyphens
 */
export const normalizePhone = (phone: string): string => {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length > 10 && cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.length > 10 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
};

/**
 * Normalizes Vehicle Numbers to standard Indian format (e.g., MH12AB1234)
 */
export const normalizeVehicleNumber = (vehicle: string): string => {
  return vehicle.trim().replace(/[\s\-]/g, '').toUpperCase();
};

/**
 * Normalizes Names by collapsing extra whitespace
 */
export const normalizeName = (name: string): string => {
  return name.trim().replace(/\s+/g, ' ');
};

/**
 * Normalizes Emails to lowercase and trimmed string
 */
export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Field Validators returning error string or null if valid
 */
export const validatePhone = (phone: string): string | null => {
  if (!phone || !phone.trim()) return 'Mobile number is required';
  const clean = normalizePhone(phone);
  if (!INDIAN_PHONE_REGEX.test(clean)) {
    return 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email || !email.trim()) return 'Email address is required';
  const clean = normalizeEmail(email);
  if (!EMAIL_REGEX.test(clean)) {
    return 'Please enter a valid email address (e.g. user@pict.edu)';
  }
  return null;
};

export const validatePasswordStrength = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters long';
  return null;
};

export const validateName = (name: string, label = 'Name'): string | null => {
  if (!name || !name.trim()) return `${label} is required`;
  const clean = normalizeName(name);
  if (clean.length < 2) return `${label} must be at least 2 characters`;
  if (!NAME_REGEX.test(clean)) return `${label} should contain letters and spaces only`;
  return null;
};

export const validateVehicleNumber = (vehicle: string, isRequired = false): string | null => {
  if (!vehicle || !vehicle.trim()) {
    if (isRequired) return 'Vehicle registration number is required';
    return null;
  }
  const clean = normalizeVehicleNumber(vehicle);
  if (!INDIAN_VEHICLE_REGEX.test(clean)) {
    return 'Please enter a valid Indian vehicle registration number (e.g. MH12AB1234)';
  }
  return null;
};

export const validatePrn = (prn: string, isRequired = false): string | null => {
  if (!prn || !prn.trim()) {
    if (isRequired) return 'Student PRN is required';
    return null;
  }
  const clean = prn.trim().toUpperCase();
  if (!PRN_REGEX.test(clean)) {
    return 'PRN must be 8 to 20 alphanumeric characters (e.g. C2K21001)';
  }
  return null;
};

export const validatePurpose = (purpose: string, label = 'Purpose'): string | null => {
  if (!purpose || !purpose.trim()) return `${label} is required`;
  const clean = purpose.trim();
  if (clean.length < 3) return `${label} must be at least 3 characters`;
  if (MEANINGLESS_INPUTS.has(clean.toLowerCase()) || /^(\w)\1+$/.test(clean)) {
    return `Please enter a specific, meaningful ${label.toLowerCase()}`;
  }
  return null;
};
