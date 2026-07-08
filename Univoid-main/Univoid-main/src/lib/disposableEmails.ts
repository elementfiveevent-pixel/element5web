// Common disposable email domains for client-side validation
// This is a subset for quick client-side checks - full validation happens server-side
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'mailinator.com',
  'throwaway.email',
  'temp-mail.org',
  'fakeinbox.com',
  'trashmail.com',
  'getnada.com',
  'yopmail.com',
  'sharklasers.com',
  'guerrillamail.info',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.de',
  'pokemail.net',
  'spam4.me',
  'binkmail.com',
  'safetymail.info',
  'spamfree24.org',
  'trashmail.net',
  'mailnesia.com',
  'anonbox.net',
  'mohmal.com',
  'tempail.com',
  'maildrop.cc',
  'dispostable.com',
  'mailsac.com',
  'tempr.email',
  'mintemail.com',
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

export function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}