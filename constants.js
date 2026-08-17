/**
 * SVAROG Command Center v3.0.0 FULL - Constants & Configuration
 */

// ============================================================
// ROLES & PERMISSIONS
// ============================================================
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MODERATOR: 'moderator',
  OPERATOR: 'operator'
};

const ROLE_PERMISSIONS = {
  super_admin: {
    admins: ['read', 'create', 'update', 'delete'],
    config: ['read', 'write', 'delete'],
    orders: ['read', 'create', 'update', 'delete'],
    customers: ['read', 'create', 'update', 'delete'],
    campaigns: ['read', 'create', 'update', 'delete'],
    analytics: ['read', 'export'],
    logs: ['read', 'delete'],
    settings: ['read', 'write'],
    backups: ['read', 'create', 'restore', 'delete']
  },
  moderator: {
    admins: [],
    config: ['read'],
    orders: ['read', 'create', 'update'],
    customers: ['read', 'create', 'update'],
    campaigns: ['read', 'create', 'update'],
    analytics: ['read', 'export'],
    logs: ['read'],
    settings: [],
    backups: []
  },
  operator: {
    admins: [],
    config: [],
    orders: ['read', 'update'],
    customers: ['read', 'update'],
    campaigns: ['read'],
    analytics: ['read'],
    logs: [],
    settings: [],
    backups: []
  }
};

// ============================================================
// ORDER STATUSES
// ============================================================
const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned'
};

const STATUS_COLORS = {
  pending: '#FFA500',
  confirmed: '#4CAF50',
  shipped: '#2196F3',
  delivered: '#8BC34A',
  cancelled: '#F44336',
  returned: '#FF9800'
};

// ============================================================
// PAYMENT METHODS
// ============================================================
const PAYMENT_METHODS = {
  MONOBANK: 'monobank',
  LIQPAY: 'liqpay',
  CASH: 'cash',
  TRANSFER: 'transfer'
};

// ============================================================
// DELIVERY METHODS
// ============================================================
const DELIVERY_METHODS = {
  NOVA_POSHTA: 'nova_poshta',
  COURIER: 'courier',
  PICKUP: 'pickup',
  UKRPOSHTA: 'ukrposhta'
};

// ============================================================
// CAMPAIGN TYPES
// ============================================================
const CAMPAIGN_TYPES = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push'
};

const CAMPAIGN_STATUSES = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENT: 'sent',
  FAILED: 'failed'
};

// ============================================================
// EMAIL TEMPLATES
// ============================================================
const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: 'order_confirmation',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  PASSWORD_RESET: 'password_reset',
  WELCOME: 'welcome',
  MARKETING: 'marketing',
  FEEDBACK_RESPONSE: 'feedback_response'
};

// ============================================================
// SMS TEMPLATES
// ============================================================
const SMS_TEMPLATES = {
  ORDER_CONFIRMATION: 'order_confirmation',
  ORDER_STATUS: 'order_status',
  OTP: 'otp',
  DELIVERY_NOTIFICATION: 'delivery_notification'
};

// ============================================================
// FIRESTORE COLLECTIONS
// ============================================================
const FIRESTORE_COLLECTIONS = {
  ADMINS: 'admins',
  CONFIG: 'config',
  ORDERS: 'orders',
  CUSTOMERS: 'customers',
  CAMPAIGNS: 'campaigns',
  FEEDBACK: 'feedback',
  ADMIN_LOGS: 'admin_logs',
  NEWS: 'news',
  MERCH: 'merch',
  HUB_LINKS: 'hub_links',
  REPORTS: 'reports',
  TEMPLATES: 'templates'
};

// ============================================================
// CONFIG SUBCOLLECTIONS
// ============================================================
const CONFIG_SECTIONS = {
  TELEGRAM: 'telegram',
  MONOBANK: 'monobank',
  LIQPAY: 'liqpay',
  MAILGUN: 'mailgun',
  TWILIO: 'twilio',
  NOVA_POSHTA: 'novaPoshta',
  GOOGLE_DRIVE: 'googleDrive',
  AWS_S3: 'awsS3',
  DROPBOX: 'dropbox',
  ANALYTICS: 'analytics'
};

// ============================================================
// CHART COLORS
// ============================================================
const CHART_COLORS = {
  primary: '#2196F3',
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#F44336',
  info: '#00BCD4',
  light: '#E0E0E0',
  dark: '#212121'
};

// ============================================================
// ANALYTICS PERIODS
// ============================================================
const ANALYTICS_PERIODS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  CUSTOM: 'custom'
};

// ============================================================
// VALIDATION RULES
// ============================================================
const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^(\+380|0)\d{9}$/,
  URL_REGEX: /^https?:\/\/.+/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

// ============================================================
// PAGINATION
// ============================================================
const PAGINATION = {
  PAGE_SIZE: 20,
  MAX_RESULTS: 1000
};

// ============================================================
// RATE LIMITS
// ============================================================
const RATE_LIMITS = {
  API_CALL: 100,  // per minute
  EMAIL_SEND: 50, // per day
  SMS_SEND: 100   // per day
};

// ============================================================
// EXPORT
// ============================================================
export {
  ROLES,
  ROLE_PERMISSIONS,
  ORDER_STATUSES,
  STATUS_COLORS,
  PAYMENT_METHODS,
  DELIVERY_METHODS,
  CAMPAIGN_TYPES,
  CAMPAIGN_STATUSES,
  EMAIL_TEMPLATES,
  SMS_TEMPLATES,
  FIRESTORE_COLLECTIONS,
  CONFIG_SECTIONS,
  CHART_COLORS,
  ANALYTICS_PERIODS,
  VALIDATION,
  PAGINATION,
  RATE_LIMITS
};
