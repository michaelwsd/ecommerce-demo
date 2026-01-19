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
  quantity: number,
  collectionDate?: string,
  collectionTime?: string
) {
  // Build message content with collection info
  let content = `${customerName} wants ${quantity} of "${productName}".\n\nContact them at: ${customerPhone}`;
  if (collectionDate && collectionTime) {
    content += `\n\nPreferred collection: ${collectionDate} at ${collectionTime}`;
  }

  // Save message to owner inbox
  createOwnerMessage(
    'inquiry',
    `Product Inquiry: ${productName}`,
    content,
    { customerName, customerPhone, productName, quantity, collectionDate, collectionTime }
  );

  console.log('========================================');
  console.log('📬 NEW INQUIRY MESSAGE SAVED TO INBOX');
  console.log(`Customer: ${customerName}`);
  console.log(`Product: ${productName}`);
  console.log(`Quantity: ${quantity}`);
  if (collectionDate && collectionTime) {
    console.log(`Collection: ${collectionDate} at ${collectionTime}`);
  }
  console.log('========================================');

  return { success: true };
}

export async function sendOrderCancellationToOwner(
  customerName: string,
  customerPhone: string,
  productName: string,
  quantity: number
) {
  const content = `${customerName} canceled their order for ${quantity} of "${productName}".\n\nContact them at: ${customerPhone}`;

  createOwnerMessage(
    'inquiry',
    `Order Canceled: ${productName}`,
    content,
    { customerName, customerPhone, productName, quantity }
  );

  console.log('========================================');
  console.log('📬 ORDER CANCELLATION SAVED TO INBOX');
  console.log(`Customer: ${customerName}`);
  console.log(`Product: ${productName}`);
  console.log(`Quantity: ${quantity}`);
  console.log('========================================');

  return { success: true };
}
