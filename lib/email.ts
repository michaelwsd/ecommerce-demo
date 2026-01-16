// Message functions - saves to owner inbox
import { createOwnerMessage } from './db';

export async function sendVerificationCodeToOwner(phone: string, code: string) {
  // Save message to owner inbox - show code and phone number
  createOwnerMessage(
    'verification',
    `Verification Code for ${phone}`,
    code,
    { code, phone }
  );

  console.log('========================================');
  console.log('📬 NEW VERIFICATION MESSAGE SAVED TO INBOX');
  console.log(`Phone: ${phone}`);
  console.log(`Verification Code: ${code}`);
  console.log('========================================');

  return { success: true, code }; // Remove code from return in production!
}

export async function sendInquiryNotificationToOwner(
  customerName: string,
  customerPhone: string,
  productName: string,
  collectionDate?: string,
  collectionTime?: string
) {
  // Build message content with collection info
  let content = `${customerName} is interested in "${productName}".\n\nContact them at: ${customerPhone}`;
  if (collectionDate && collectionTime) {
    content += `\n\nPreferred collection: ${collectionDate} at ${collectionTime}`;
  }

  // Save message to owner inbox
  createOwnerMessage(
    'inquiry',
    `Product Inquiry: ${productName}`,
    content,
    { customerName, customerPhone, productName, collectionDate, collectionTime }
  );

  console.log('========================================');
  console.log('📬 NEW INQUIRY MESSAGE SAVED TO INBOX');
  console.log(`Customer: ${customerName}`);
  console.log(`Product: ${productName}`);
  if (collectionDate && collectionTime) {
    console.log(`Collection: ${collectionDate} at ${collectionTime}`);
  }
  console.log('========================================');

  return { success: true };
}
