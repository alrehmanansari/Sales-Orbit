export const TEAM_MEMBERS = [
  'Alice Johnson', 'Bob Martinez', 'Clara Singh', 'David Kim',
  'Emma Chen', 'Farhan Sheikh', 'Grace Liu', 'Hassan Ali'
]

export const LEAD_SOURCES = [
  'Customer Referral', 'Online Directory', 'Marketing Campaign',
  'Trade Show/Event', 'Cold Outreach', 'Others'
]

export const VERTICALS = ['IT Services', 'Ecom Seller', 'B2B Seller', 'Freelancer']

export const NATURE_OF_BUSINESS = [
  'AI Solutions', 'App Development', 'B2B Goods', 'BPO',
  'Digital Accountancy', 'Digital Marketing Agency', 'E-comm Marketplaces',
  'Game Development', 'HR Management', 'IT Services', 'Logistics',
  'Medical Billing', 'PayPal', 'Shopify', 'Software Development',
  'Stripe', 'Web Development'
]

export const PRIORITIES = ['Hot', 'Warm', 'Cold']

export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost']

export const CALL_TYPES = [
  'Discovery Call', 'Follow-Up Call', 'Demo Call', 'Customer Support Call'
]

export const CALL_OUTCOME_PRIMARY = [
  'Connected', 'Call Later', 'Not Responded', 'Wrong Number'
]

export const CALL_OUTCOME_CONNECTED = [
  'Interested', 'Not Interested', 'Low Volume', 'Unsupported NOB'
]

export const CALL_OUTCOMES = [
  'Connected – Interested', 'Connected – Not Interested',
  'Connected – Low Volume', 'Connected – Unsupported NOB',
  'Call Later', 'Not Responded', 'Wrong Number'
]

export const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'WhatsApp', 'Note']

export const OPPORTUNITY_STAGES = [
  'Prospecting', 'Won', 'Onboarded', 'Activated', 'Lost', 'On Hold'
]

export const ACTIVE_STAGES = ['Prospecting', 'Won', 'Onboarded', 'Activated']

export const LOST_REASONS = [
  'Pricing', 'Competitor', 'User Experience', 'Product Feature',
  'Risk & Compliance', 'No Response'
]

export const COMPETITORS = [
  'Payoneer', 'Local Banks', 'Ping Pong', 'Airwallex',
  'Slash', 'Wise', 'Elevate Pay', 'Other'
]

export const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
  'London', 'Dubai', 'Singapore', 'Mumbai', 'Delhi',
  'Karachi', 'Lahore', 'Islamabad', 'Toronto', 'Sydney',
  'Berlin', 'Paris', 'Amsterdam', 'Tokyo', 'Shanghai',
  'Hong Kong', 'São Paulo', 'Mexico City', 'Riyadh', 'Cairo'
]

export const STAGE_COLORS = {
  Prospecting: 'var(--so-blue)',
  Won:         'var(--so-purple)',
  Onboarded:   '#1E8E3E',
  Activated:  'var(--so-pink)',
  Lost:        '#D93025',
  'On Hold':   'var(--text-tertiary)'
}

export const STAGE_ORDER = ['Prospecting', 'Won', 'Onboarded', 'Activated']

export const OUTCOME_COLORS = {
  'Connected – Interested':       'badge-success',
  'Connected – Not Interested':   'badge-error',
  'Connected – Low Volume':       'badge-warning',
  'Connected – Unsupported NOB':  'badge-error',
  'Call Later':                   'badge-info',
  'Not Responded':                'badge-neutral',
  'Wrong Number':                 'badge-error',
  'Connected – Call Later':       'badge-info',
  'Voicemail Left':               'badge-warning',
}

export const PRIORITY_BADGE = { Hot: 'badge-hot', Warm: 'badge-warm', Cold: 'badge-cold' }

export const STATUS_BADGE = {
  New: 'badge-new', Contacted: 'badge-contacted', Qualified: 'badge-qualified',
  Converted: 'badge-converted', Lost: 'badge-dead', Dead: 'badge-dead'
}

export const STAGE_BADGE = {
  Prospecting: 'badge-prospecting', Won: 'badge-won', Onboarded: 'badge-onboarded',
  Activated: 'badge-transacted', Lost: 'badge-lost', 'On Hold': 'badge-on-hold'
}

export const TIME_FILTERS = [
  { label: 'This Week',    value: 'week' },
  { label: 'This Month',   value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year',    value: 'year' },
  { label: 'All Time',     value: 'all' },
  { label: 'Custom',       value: 'custom' },
]

export const ACTIVITY_ICONS = {
  Call: '📞', Email: '✉️', Meeting: '🤝', WhatsApp: '💬', Note: '📝'
}

export const ROLES = { MANAGER: 'Manager', REP: 'Rep' }

export const CSV_TEMPLATE_HEADERS = [
  'Contact Person', 'Company Name', 'Website', 'Email ID', 'Phone Number',
  'City', 'Lead Source', 'Vertical', 'Nature of Business', 'Lead Owner',
  'Priority', 'Notes'
]

export const DESIGNATIONS = [
  'Business Development Manager',
  'Country Manager',
  'Customer Onboarding Specialist',
  'Head of MENA',
  'Head of Sales',
  'Sales Development Representative',
]

export const MANAGER_DESIGNATIONS = ['Head of Sales', 'Country Manager', 'Head of MENA']
