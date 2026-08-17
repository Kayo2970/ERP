// LEADS Design Tokens & Shared Formatters

export function getRatingColor(score: number): {
  bg: string;
  text: string;
  border: string;
  hex: string;
} {
  if (score >= 4.5) {
    return {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-500 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      hex: '#10B981',
    };
  } else if (score >= 4.0) {
    return {
      bg: 'bg-green-500/15',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-500/30',
      hex: '#22C55E',
    };
  } else if (score >= 3.0) {
    return {
      bg: 'bg-amber-500/15',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30',
      hex: '#F59E0B',
    };
  } else if (score >= 2.0) {
    return {
      bg: 'bg-orange-500/15',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-500/30',
      hex: '#F97316',
    };
  } else {
    return {
      bg: 'bg-red-500/15',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-500/30',
      hex: '#EF4444',
    };
  }
}

export function maskBankDetails(details: string, revealed = false): string {
  if (!details) return 'N/A';
  if (revealed) return details;
  // If details contain account number or digits, mask all except last 4
  const digits = details.replace(/\D/g, '');
  if (digits.length >= 4) {
    const last4 = digits.slice(-4);
    // Keep bank name if present
    const parts = details.split('-');
    const bankPrefix = parts.length > 1 ? parts[0].trim() : 'Bank A/C';
    return `${bankPrefix} - •••• •••• ${last4}`;
  }
  return '•••• •••• ••••';
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}
