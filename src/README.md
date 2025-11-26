# 🗳️ BlockBallot MVP - Secure Voting Platform

A secure, privacy-preserving web voting application built with React, Supabase, and modern web technologies.

## ⚠️ Important Notice

**This application is for demonstration and prototyping purposes only.** It should NOT be used for collecting personally identifiable information (PII) or handling real election data with sensitive voter information. For production use, additional security measures, infrastructure, and compliance certifications would be required.

## 🌟 Features

### Authentication & Security
- ✅ User registration and login
- ✅ Email-based 2FA (Two-Factor Authentication)
- ✅ Secure password handling with Supabase Auth
- ✅ Session management with JWT tokens

### Election Management
- ✅ Create elections with custom positions and candidates
- ✅ Set voting periods with start/end dates
- ✅ Generate unique 7-digit election codes
- ✅ Share elections via code or direct link
- ✅ Upload voter eligibility lists (CSV/email list)

### Voting Experience
- ✅ Three ballot types: Single Choice, Multiple Choice, Ranked Choice
- ✅ Real-time eligibility checking
- ✅ One person, one vote enforcement
- ✅ Vote receipt generation
- ✅ Anonymous ballot storage

### Access Control
- ✅ Pre-approved voter lists
- ✅ Access request system for non-listed voters
- ✅ Admin approval/denial workflow
- ✅ Role-based access (all users can vote AND host elections)

### Results & Analytics
- ✅ Live results dashboard (admin-only during voting)
- ✅ Public results after election closes
- ✅ Interactive charts (bar charts, pie charts)
- ✅ Turnout statistics
- ✅ Export results (JSON format)
- ✅ Detailed candidate rankings

## 🚀 Getting Started

### Quick Start

1. **Sign Up**: Create an account with your name, email, and password
2. **Verify**: Complete 2FA verification (OTP is emailed via Resend)
3. **Dashboard**: Access your dashboard to create or join elections

### Creating an Election

1. Click **"New Election"** on the dashboard
2. Fill in election details:
   - Title and description
   - Start and end date/time
   - Positions (e.g., President, Secretary)
   - Candidates for each position
   - Ballot type per position
3. Click **"Create Election"**
4. Upload voter eligibility list or share the election code

### Joining an Election

1. Enter the **7-digit election code** on the dashboard, OR
2. Click a direct election link shared by the admin
3. Request access if not pre-approved
4. Cast your vote when the election is active

### Managing Elections

1. Go to **"Manage"** on your hosted elections
2. Upload voter lists via email addresses
3. Review and approve/deny access requests
4. Share election code or direct link
5. Monitor results in real-time

## 🏗️ Technical Architecture

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Shadcn UI** component library

### Backend
- **Supabase** (PostgreSQL database)
- **Hono** web server (Deno edge function)
- **Supabase Auth** for authentication

### Data Storage
- Uses Supabase KV store for flexible data management
- Key-value pairs for users, elections, ballots, eligibility, and audit trails

### Security Features
- Password hashing via Supabase Auth
- JWT token authentication
- Email OTP 2FA
- Anonymous ballot storage (ballot contents separated from voter identity)
- Audit trail for all votes

## 📊 Data Model

### Core Entities
- **Users**: Account information and authentication
- **Elections**: Election metadata, dates, and settings
- **Positions**: Voting positions within elections
- **Candidates**: Candidates for each position
- **Voter Eligibility**: Pre-approved voter lists
- **Access Requests**: Pending approval requests
- **Ballots**: Anonymous vote records
- **Ballot Links**: Proof of voting (links user to ballot ID without exposing vote)
- **Audit Trail**: Vote verification and blockchain preparation

## 🔐 Security Considerations

### Current Implementation
- ✅ 2FA via email OTP
- ✅ Secure password handling
- ✅ One vote per user enforcement
- ✅ Anonymous ballot storage
- ✅ Audit trail generation
- ✅ Receipt hash generation

### Future Enhancements for Production
- [ ] Blockchain/distributed ledger integration
- [ ] End-to-end encryption
- [ ] Government ID verification
- [ ] Biometric authentication
- [ ] Multi-admin approval workflows
- [ ] Advanced fraud detection
- [ ] Comprehensive audit logging
- [ ] GDPR/CCPA compliance
- [ ] Penetration testing
- [ ] Security certifications

## 🎯 Use Cases

Perfect for:
- 🏫 Student government elections
- 🏢 Corporate board elections
- 🤝 Club and organization voting
- 🏘️ Community decision-making
- 📊 Surveys and polls
- 🎓 Academic committee elections

**Not suitable for**:
- ❌ Government/civic elections
- ❌ High-stakes legal decisions
- ❌ Elections requiring legal compliance
- ❌ Large-scale elections (>500 voters)

## 🛠️ Development Notes

### API Endpoints

**Authentication**
- `POST /auth/register` - Create new account
- `POST /auth/login` - Sign in
- `POST /auth/verify-2fa` - Verify OTP
- `POST /auth/resend-otp` - Resend OTP code
- `GET /auth/me` - Get current user
- `POST /api/send-otp` - Generate & email OTP (Next.js route)
- `POST /api/verify-otp` - Verify OTP code (Next.js route)

**Elections**
- `POST /elections` - Create election
- `GET /elections` - List elections
- `GET /elections/:id` - Get election details
- `POST /elections/:id/eligibility` - Upload voter list
- `GET /elections/:id/eligibility-status` - Check if eligible
- `POST /elections/:id/cast-vote` - Cast vote
- `GET /elections/:id/results` - View results

**Access Management**
- `POST /elections/:id/access-request` - Request access
- `GET /elections/:id/access-requests` - List requests (admin)
- `PATCH /elections/:id/access-requests/:rid` - Approve/deny request

### Development Mode Features

- OTP codes are delivered through the Resend test domain (no on-screen fallback)
- All error messages include detailed context
- Console logging for debugging

## 📧 Email OTP via Resend

BlockBallot now sends production-safe OTP codes using [Resend](https://resend.com/). Codes are generated as 6-digit strings, hashed with a per-code salt, stored inside Supabase with a 5-minute expiry, and never logged or displayed.

### Environment Variables

Create `.env.local` with the following keys (server-only):

```
RESEND_API_KEY=your_resend_api_key
# Optional – defaults to BlockBallot <onboarding@resend.dev>
RESEND_FROM_EMAIL="BlockBallot <onboarding@resend.dev>"
SUPABASE_URL=https://ncxlkhvlskwkksukgcyo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` grants full database access. Never expose it to the browser or commit it to source control.

### OTP API Routes (Next.js App Router)

- `POST /api/send-otp` – Accepts `{ email }`, rate-limits requests per email, hashes and stores the OTP with a 5-minute TTL, and sends the code via Resend’s free test domain.
- `POST /api/verify-otp` – Accepts `{ email, otp }`, validates the hash, enforces expiry/attempt limits, and deletes the OTP record so it can’t be reused.

### Client Usage Example

```ts
await fetch('/api/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'voter@example.com' }),
});
```

### Test with cURL

```bash
curl -X POST http://localhost:3000/api/send-otp \
  -H 'Content-Type: application/json' \
  -d '{"email":"voter@example.com"}'

curl -X POST http://localhost:3000/api/verify-otp \
  -H 'Content-Type: application/json' \
  -d '{"email":"voter@example.com","otp":"123456"}'
```

## 📝 License & Disclaimer

This is a demonstration project. Use at your own risk. The developers assume no liability for data loss, security breaches, or misuse of this software.

For production elections, consult with legal experts, security professionals, and consider certified election platforms.

## 🔮 Future Roadmap

1. **Blockchain Integration** - Immutable vote ledger
2. **Email Service** - SendGrid/Resend integration for OTP delivery
3. **SMS 2FA** - Text message verification option
4. **Advanced Analytics** - Demographic breakdowns, time-series voting patterns
5. **Mobile App** - Native iOS/Android applications
6. **Multi-language Support** - Internationalization
7. **Accessibility Improvements** - WCAG AAA compliance
8. **Real-time Notifications** - Election updates and reminders

## 🤝 Contributing

This is a demonstration project. For production use cases, please fork and enhance with proper security audits and compliance measures.

---

Built with ❤️ using React, Supabase, and modern web technologies.
