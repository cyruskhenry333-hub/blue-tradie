# Blue Tradie

A comprehensive business platform built specifically for Australian and New Zealand tradies, featuring AI-powered business tools, smart invoicing, and automated workflows.

## Authentication System

Blue Tradie uses a secure magic-link authentication system with no passwords required.

### Authentication Flow

1. **Request Login**: User enters email at `/login`
2. **Magic Link Sent**: System sends secure login link to email (if account exists)
3. **Verify & Login**: User clicks link, token is verified and consumed, session created
4. **Dashboard Access**: User is redirected to dashboard with secure session cookie

### Key Features

- **Passwordless**: No passwords to remember or manage
- **Single-use tokens**: Each magic link can only be used once
- **Time-limited**: Links expire after 15 minutes (configurable)
- **Rate limited**: 3 requests per 15 minutes per IP
- **No user enumeration**: Same response whether email exists or not
- **Secure sessions**: HttpOnly cookies with 30-day TTL
- **Automatic cleanup**: Expired tokens and sessions are cleaned up

### API Endpoints

#### POST `/api/auth/request-login`
Request a magic link for email-based login.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account exists with this email, a login link has been sent."
}
```

#### GET `/auth/verify?token=<token>`
Verify magic link token and create authenticated session.

**Query Parameters:**
- `token`: Magic link token from email
- `continue`: Optional redirect URL after login

**Response:** Redirects to dashboard or continue URL

#### POST `/api/auth/logout`
Logout user and revoke session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Environment Variables

Required environment variables for authentication:

```bash
# App Configuration
APP_URL=https://yourapp.com                    # Public app URL for magic links
APP_DOMAIN=yourapp.com                         # Cookie domain
DATABASE_URL=postgresql://...                  # Database connection

# Session Configuration
SESSION_COOKIE_NAME=bt_sess                    # Cookie name (default: bt_sess)
SESSION_TTL_DAYS=30                           # Session lifetime (default: 30)
MAGIC_LINK_TTL_MINUTES=15                     # Magic link lifetime (default: 15)

# Email Configuration
EMAIL_FROM_NAME="Blue Tradie"                 # From name for emails
EMAIL_FROM_ADDRESS=noreply@bluetradie.com     # From address for emails
SENDGRID_API_KEY=sg-...                       # SendGrid API key

# Preview/Development
DISABLE_EMAIL_SENDING=true                    # Disable emails in preview (logs instead)
PREVIEW_DISABLE_DEMO_ROUTES=true              # Disable demo routes in preview
```

### Database Schema

The authentication system uses two main tables:

#### `auth_sessions`
Stores user authentication sessions.

```sql
CREATE TABLE auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  ip_address TEXT NULL,
  user_agent TEXT NULL
);
```

#### `magic_link_tokens`
Stores magic link tokens for passwordless authentication.

```sql
CREATE TABLE magic_link_tokens (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  user_id TEXT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL DEFAULT 'login',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP NULL,
  ip_address TEXT NULL,
  user_agent TEXT NULL
);
```

### Stripe Integration

When users complete Stripe checkout:

1. Webhook creates user account
2. Magic link token is automatically generated
3. Welcome email sent with magic link for immediate access
4. User can access dashboard without separate login step

### Preview Mode

In preview environments, set these environment variables:

```bash
DISABLE_EMAIL_SENDING=true
PREVIEW_DISABLE_DEMO_ROUTES=true
```

This will:
- Log magic links to console instead of sending emails
- Disable demo routes that might cause timeouts
- Enable fast `/healthz` endpoint for health checks

### Security Features

- **Token hashing**: Only SHA-256 hashes stored in database
- **Rate limiting**: Prevents abuse with 3 requests per 15 minutes
- **Single-use tokens**: Tokens are consumed on first use
- **Secure cookies**: HttpOnly, Secure (in production), SameSite=Lax
- **Session cleanup**: Automatic cleanup of expired sessions and tokens
- **No user enumeration**: Same response for existing/non-existing emails

## Development

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `npm run db:push`
5. Start development server: `npm run dev`

### Testing Authentication

1. Create a user account through Stripe checkout
2. Try logging in at `/login` with the user's email
3. Check console logs for magic link in preview mode
4. Verify session persistence across page reloads
5. Test logout functionality

### Building for Production

```bash
npm run build
npm start
```

### Health Check

The application includes a fast health check endpoint at `/healthz` that returns `ok` without hitting external services.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Magic links with secure sessions
- **Email**: SendGrid for transactional emails
- **Payments**: Stripe for subscriptions and billing
- **Frontend**: React, TypeScript, Vite
- **Deployment**: Render with auto-deploy from GitHub

## License

MIT License