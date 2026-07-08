/**
 * WhatsApp contact utility for books
 * Generates privacy-safe WhatsApp redirect URLs
 */

type ListingType = 'sell' | 'rent' | 'donate' | 'exchange';

interface WhatsAppMessageParams {
  bookName: string;
  price?: number | null;
  listingType: ListingType;
  sellerMobile: string;
}

/**
 * Gets the listing type from the database value or infers from price
 */
export function getListingType(listingType?: string | null, price?: number | null): ListingType {
  if (listingType && ['sell', 'rent', 'donate', 'exchange'].includes(listingType)) {
    return listingType as ListingType;
  }
  // Fallback for old books without listing_type
  if (price === null || price === undefined || price === 0) {
    return 'exchange';
  }
  return 'sell';
}

/**
 * Generates a WhatsApp message based on listing type
 */
function generateMessage(params: WhatsAppMessageParams): string {
  const { bookName, price, listingType } = params;
  
  let message = '';
  
  switch (listingType) {
    case 'sell':
      message = `Hi 👋
I'm interested in your book:

📘 Book Name: ${bookName}
💰 Price: ₹${price}

Is it still available?`;
      break;
      
    case 'rent':
      message = `Hi 👋
I'm interested in renting your book:

📘 Book Name: ${bookName}
💰 Rent: ₹${price}

Please share details.`;
      break;
      
    case 'donate':
      message = `Hi 👋
I saw your book listed for donation:

📘 Book Name: ${bookName}

Is it still available?`;
      break;
      
    case 'exchange':
    default:
      message = `Hi 👋
I'm interested in exchanging for your book:

📘 Book Name: ${bookName}

Is it still available?`;
      break;
  }
  
  message += '\n\n— via UniVoid Book Exchange';
  
  return message;
}

/**
 * Formats phone number for WhatsApp (removes non-digits, adds country code)
 */
function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 91 (India)
  if (digits.startsWith('0')) {
    digits = '91' + digits.substring(1);
  }
  
  // If doesn't have country code (less than 12 digits), add 91
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  
  return digits;
}

/**
 * Opens WhatsApp with pre-filled message
 */
export function openWhatsAppContact(params: WhatsAppMessageParams): void {
  const { sellerMobile } = params;
  
  if (!sellerMobile || sellerMobile === '••••••••••') {
    // Phone is masked, can't open WhatsApp
    return;
  }
  
  const formattedPhone = formatPhoneForWhatsApp(sellerMobile);
  const message = generateMessage(params);
  const encodedMessage = encodeURIComponent(message);
  
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Generates WhatsApp URL without opening (for link display)
 */
export function getWhatsAppUrl(params: WhatsAppMessageParams): string | null {
  const { sellerMobile } = params;
  
  if (!sellerMobile || sellerMobile === '••••••••••') {
    return null;
  }
  
  const formattedPhone = formatPhoneForWhatsApp(sellerMobile);
  const message = generateMessage(params);
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}
