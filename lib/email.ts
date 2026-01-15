// Placeholder email function
// Replace this with your actual email service (e.g., SendGrid, Resend, Nodemailer)

export async function sendVerificationCodeToOwner(code: string, deviceId: string) {
  // Get owner email from environment variable
  const ownerEmail = process.env.OWNER_EMAIL || 'owner@example.com';

  console.log('========================================');
  console.log('📧 VERIFICATION CODE EMAIL');
  console.log('========================================');
  console.log(`To: ${ownerEmail}`);
  console.log(`Subject: New Device Verification Request`);
  console.log(`Body: A new device is requesting access.`);
  console.log(`Device ID: ${deviceId}`);
  console.log(`Verification Code: ${code}`);
  console.log('========================================');

  // TODO: Implement actual email sending
  // Example with SendGrid:
  // await sgMail.send({
  //   to: ownerEmail,
  //   from: 'noreply@yourstore.com',
  //   subject: 'New Device Verification Request',
  //   text: `Verification code: ${code}`,
  // });

  return { success: true, code }; // Remove code from return in production!
}

export async function sendInquiryNotificationToOwner(
  customerName: string,
  customerPhone: string,
  productName: string
) {
  const ownerEmail = process.env.OWNER_EMAIL || 'owner@example.com';

  console.log('========================================');
  console.log('📧 NEW PRODUCT INQUIRY');
  console.log('========================================');
  console.log(`To: ${ownerEmail}`);
  console.log(`Subject: New Product Inquiry`);
  console.log(`Customer Name: ${customerName}`);
  console.log(`Customer Phone: ${customerPhone}`);
  console.log(`Product: ${productName}`);
  console.log('========================================');

  // TODO: Implement actual email/SMS notification

  return { success: true };
}
