// Message functions - saves to owner inbox
import { createOwnerMessage } from './db';

export async function sendVerificationCodeToOwner(code: string, deviceId: string) {
  // Save message to owner inbox - only show code, no device info
  createOwnerMessage(
    'verification',
    'New Verification Code',
    code,
    { code, deviceId }
  );

  console.log('========================================');
  console.log('📬 NEW VERIFICATION MESSAGE SAVED TO INBOX');
  console.log(`Verification Code: ${code}`);
  console.log('========================================');

  return { success: true, code }; // Remove code from return in production!
}

export async function sendInquiryNotificationToOwner(
  customerName: string,
  customerPhone: string,
  productName: string
) {
  // Save message to owner inbox
  createOwnerMessage(
    'inquiry',
    `Product Inquiry: ${productName}`,
    `${customerName} is interested in "${productName}".\n\nContact them at: ${customerPhone}`,
    { customerName, customerPhone, productName }
  );

  console.log('========================================');
  console.log('📬 NEW INQUIRY MESSAGE SAVED TO INBOX');
  console.log(`Customer: ${customerName}`);
  console.log(`Product: ${productName}`);
  console.log('========================================');

  return { success: true };
}
