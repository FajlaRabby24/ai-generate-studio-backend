# AI Generate Studio — Backend

This is the backend for the **AI Generate Studio**, a full-stack AI SaaS platform where users can generate AI-powered images, videos, and audio using ModelsLab APIs.

## 1. Project Overview

A REST API server built with Express.js and TypeScript, handling authentication, AI generation requests, subscription billing, and history management.

**Core Features:**
- JWT Authentication & Session Management
- ModelsLab API Integration for AI Image/Video/Audio generation
- Freemium model with daily request limits (3/day for free users)
- Subscription & Billing via Stripe, SSLCommerz, and PayPal
- Prisma ORM with PostgreSQL database

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Bun | Fast JavaScript runtime |
| Framework | Express.js + TypeScript | REST API server |
| ORM | Prisma | Database queries |
| Database | PostgreSQL | Data storage |
| Payment | Stripe, SSLCommerz, PayPal | Subscription billing |
| AI API | ModelsLab | Generation engine |

## 3. Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed

### Installation
```bash
bun install
```

### Environment Setup
Create a `.env` file in the `backend` root and add the following:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/ai_saas_db

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# ModelsLab
MODELSLAB_API_KEY=your_modelslab_api_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...

# SSLCommerz
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_IS_LIVE=false

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_MODE=sandbox

# CORS
FRONTEND_URL=http://localhost:3000
```

### Running the Server
```bash
# Development mode (with auto-reload)
bun run dev

# Build the project
bun run build

# Start production server
bun run start
```

### Database Management (Prisma)
```bash
# Run migrations
bun run migrate

# Open Prisma Studio (GUI)
bun run studio

# Generate Prisma client
bun run generate
```

## 4. API Endpoints

### 4.1 Auth Routes — `/api/auth`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login, returns JWT | No |
| GET | `/api/auth/me` | Get current user info | Yes |
| POST | `/api/auth/logout` | Logout | Yes |

### 4.2 Generate Routes — `/api/generate`
| Method | Endpoint | Description | Auth | Rate Limit |
|---|---|---|---|---|
| POST | `/api/generate/text-to-image` | Generate image from text | Yes | Free: 3/day |
| POST | `/api/generate/text-to-video` | Generate video from text | Yes | Free: 3/day |
| POST | `/api/generate/image-to-video` | Generate video from image | Yes | Free: 3/day |
| POST | `/api/generate/image-to-image` | Edit image with prompt | Yes | Free: 3/day |
| GET | `/api/generate/status/:fetchUrl` | Poll generation status | Yes | No |

### 4.3 User Routes — `/api/user`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/user/profile` | Get profile | Yes |
| PUT | `/api/user/profile` | Update name/avatar | Yes |
| GET | `/api/user/history` | Get all generations | Yes |
| DELETE | `/api/user/history/:id` | Delete one generation | Yes |
| DELETE | `/api/user/account` | Delete account | Yes |

### 4.4 Billing Routes — `/api/billing`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/billing/stripe/checkout` | Create Stripe checkout session | Yes |
| POST | `/api/billing/sslcommerz/init` | Initiate SSLCommerz payment | Yes |
| POST | `/api/billing/paypal/create-order` | Create PayPal order | Yes |
| POST | `/api/billing/paypal/capture` | Capture PayPal payment | Yes |
| GET | `/api/billing/invoices` | Get payment history | Yes |

### 4.5 Webhook Routes — `/api/webhook`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/webhook/stripe` | Stripe event handler | Stripe sig |
| POST | `/api/webhook/sslcommerz/success` | SSLCommerz success IPN | No |
| POST | `/api/webhook/sslcommerz/fail` | SSLCommerz fail IPN | No |

## 5. ModelsLab API Integration

| Feature | ModelsLab API Endpoint | Input | Output |
|---|---|---|---|
| Text to Image | `/v6/images/text2img` | prompt, model, size | Image URL |
| Text to Video | `/v6/video/text2video` | prompt, duration | Video URL |
| Image to Video | `/v6/video/img2video` | image file, prompt | Video URL |
| Image to Image | `/v6/images/img2img` | image file, prompt | Image URL |
| Text to Speech | `/v6/voice/text2speech` | text, voice | Audio URL |

## 6. Folder Structure

```
src/
├── routes/         # API Route definitions
├── controllers/    # Request handlers
├── middleware/     # Auth, rate limiting, validation
├── services/       # External API integrations (ModelsLab, Stripe)
├── lib/            # Shared clients (Prisma, JWT)
├── utils/          # Helpers & standard responses
├── app.ts          # Express configuration
└── index.ts        # Server entry point
prisma/
└── schema.prisma   # Database schema
```

## 7. Database Schema

The project uses Prisma with PostgreSQL. Key models include:
- `User`: Handles accounts, plans, and request counting.
- `Generation`: Stores history of AI outputs.
- `Payment`: Tracks transaction history across multiple gateways.
- `Account`: Manages OAuth provider links.

Run migrations using:
```bash
bunx prisma migrate dev
```

## 8. Deployment

- **Backend:** Recommended for Render as a Web Service.
- **Database:** Recommended for Neon or Render Managed PostgreSQL.
- **Environment:** Ensure all production environment variables are set in your hosting provider's dashboard.
