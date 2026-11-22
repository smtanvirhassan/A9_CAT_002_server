# SalonBook Server

The official backend REST API server for the **SalonBook** appointment booking platform.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js 5 (ESM)
- **Database**: MongoDB (Atlas) using native MongoDB Node driver (`mongodb`)
- **Authentication**: JWT token verification via `jose` and Better Auth JWKS
- **Payment Processing**: Stripe Node SDK
- **Cross-Origin**: CORS
- **Configuration**: Dotenv

## Key Features
- **Public Services API**: Search services by name, filter by category, sort by price.
- **Role-Based Access Control**: Strict separation between `customer` and `admin` roles.
- **Conflict Prevention**: Disallows double-booking the same time slot for a service.
- **Appointment Management**:
  - Customers can submit, view, and cancel pending requests.
  - Admins can view all requests, confirm pending appointments, or cancel.
- **Stripe Integration**:
  - Secure checkout session generation for confirmed appointments.
  - Verified webhook event processing for `checkout.session.completed`.
- **User Management**:
  - Customer directory with block/unblock controls.
  - Blocked users immediately restricted from protected features.
- **Overview Metrics**: Tailored statistics for customer and admin dashboards.

## Installation & Setup

1. **Navigate to the server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Required variables:
   - `PORT`
   - `MONGODB_URI`
   - `CLIENT_URL`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`

4. **Seed Database**:
   Seeds default salon services, indexes, and administrator account:
   ```bash
   npm run seed
   ```

5. **Start Server**:
   ```bash
   npm start
   ```
   Or run in development mode:
   ```bash
   npm run dev
   ```

## Live Deployment
- **Live Website**: [https://client-one-psi.vercel.app](https://client-one-psi.vercel.app)
- **API Server Endpoint**: [https://server-gold-chi-58.vercel.app](https://server-gold-chi-58.vercel.app)

## Repository Links
- **Client Repository**: [https://github.com/smtanvirhassan/A9_CAT_002_client](https://github.com/smtanvirhassan/A9_CAT_002_client)
- **Server Repository**: [https://github.com/smtanvirhassan/A9_CAT_002_server](https://github.com/smtanvirhassan/A9_CAT_002_server)
