// Message functions - saves to owner inbox
import { createOwnerMessage } from './db';

export async function sendVerificationCodeToOwner(code: string, deviceId: string) {
  // Save message to owner inbox
  createOwnerMessage(
    'verification',
    'New Device Verification Request',
    `A new device is requesting access to your store.\n\nVerification Code: ${code}\n\nDevice ID: ${deviceId.substring(0, 8)}...`,
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
