# E-commerce MVP

A minimalistic, single-page e-commerce application built with Next.js and SQLite. Designed with accessibility in mind for older customers.

## Features

### Dual-Gate Login System

**Owner Access:**
- Hardcoded credentials (configurable via environment variables)
- Admin dashboard to add/delete products
- View customer inquiries

**Customer Access (Device-Based):**
- New devices receive a 4-digit verification code (sent to owner's email)
- Returning devices skip verification
- Customers provide name and phone number during onboarding

### Product Management
- Upload product image, name, description, and price
- Products stored in SQLite database
- Simple delete functionality

### Lead Generation
- Customers can click products to express interest
- Owner receives notification with customer name, phone, and product name
- All inquiries logged in the database

### Accessible UI
- Large, legible fonts (18px minimum)
- High contrast (dark text on light background)
- Clear, obvious buttons with rounded corners
- Single-page design with no complex navigation

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ecommerce-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` with your credentials:
```env
# Owner Credentials
OWNER_EMAIL=your_email@example.com
OWNER_PASSWORD=your_secure_password

# Email API (Optional)
# SENDGRID_API_KEY=your_api_key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### Owner Credentials

Set in `.env.local`:
- `OWNER_EMAIL` - The email address for owner login
- `OWNER_PASSWORD` - The password for owner login

**Default credentials (for testing):**
- Email: `admin@store.com`
- Password: `admin123`

### Email Notifications (Optional)

The app includes a placeholder email function. To enable actual email notifications:

1. Sign up for an email service (SendGrid, Resend, etc.)
2. Add your API key to `.env.local`
3. Update `lib/email.ts` with your email service integration

Example with SendGrid:
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendVerificationCodeToOwner(code: string, deviceId: string) {
  await sgMail.send({
    to: process.env.OWNER_EMAIL,
    from: 'noreply@yourstore.com',
    subject: 'New Device Verification Request',
    text: `Verification code: ${code}\nDevice ID: ${deviceId}`,
  });
}
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/          # Owner authentication
│   │   ├── customer/      # Customer onboarding
│   │   ├── inquiry/       # Product inquiries
│   │   ├── products/      # Product CRUD
│   │   └── verify/        # Device verification
│   ├── globals.css        # Accessible styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main single-page app
├── lib/
│   ├── auth.ts            # Authentication utilities
│   ├── db.ts              # SQLite database operations
│   ├── email.ts           # Email placeholder functions
│   └── types.ts           # TypeScript interfaces
├── data/                  # SQLite database (auto-created)
├── public/uploads/        # Product images
└── .env.local             # Environment variables
```

## Database Schema

The SQLite database (`data/store.db`) contains:

- **products** - Product catalog
- **verified_devices** - Verified customer devices
- **pending_verifications** - Temporary verification codes
- **inquiries** - Customer product inquiries

## Development vs Production

In development mode:
- Verification codes are displayed on screen (for testing)
- Email notifications are logged to console

For production:
- Configure actual email service
- Remove code display from verification response
- Consider adding rate limiting
- Enable HTTPS

## Usage

### As Owner
1. Click "I am the Store Owner"
2. Enter credentials
3. Add products with name, description, price, and image
4. View customer inquiries in the "Inquiries" tab

### As Customer
1. Click "I am a Customer"
2. Enter verification code (check owner's email or console in dev mode)
3. Enter your name and phone number
4. Browse products and click to inquire

## License

MIT
