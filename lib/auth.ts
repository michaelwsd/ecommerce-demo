// Owner credentials from environment variables
export function getOwnerCredentials() {
  return {
    email: process.env.OWNER_EMAIL || 'admin@store.com',
    password: process.env.OWNER_PASSWORD || 'admin123',
  };
}

export function validateOwnerCredentials(email: string, password: string): boolean {
  const credentials = getOwnerCredentials();
  return email === credentials.email && password === credentials.password;
}

export function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function generateDeviceId(): string {
  return 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
