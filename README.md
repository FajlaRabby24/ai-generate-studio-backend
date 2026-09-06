# ⚙️ AI Generate Studio — Backend REST API

<div align="center">

[![Bun](https://img.shields.io/badge/Bun-Runtime-fbf0df?style=for-the-badge&logo=bun&logoColor=black)](https://bun.sh/)
[![Express.js](https://img.shields.io/badge/Express.js-5.2.1-lightgrey?style=for-the-badge&logo=express&logoColor=black)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

<p align="center">
  <b>High-throughput, scalable backend API engine powering multi-modal AI generation workflows, streaming LLM chat, background workers, and automated subscription monetization.</b>
</p>

</div>

---

## 📖 1. Overview

The **AI Generate Studio Backend** is built with **Express.js 5**, **TypeScript**, and **Bun**, interfacing with **PostgreSQL** via **Prisma ORM 7**. It handles authentication, asynchronous AI generation queues, rate limiting, daily freemium quotas, Stripe and SSLCommerz webhooks, and transactional database logs.

---

## 📚 2. AI Services & External Documentation References

| AI Feature / Service     | Provider & Model                      | Purpose                                                     | Documentation Link                                                |
| :----------------------- | :------------------------------------ | :---------------------------------------------------------- | :---------------------------------------------------------------- |
| **Image to Video**       | Pixazo AI (`LTX Video`)               | Dynamic video loop synthesis from image + motion prompt     | [Pixazo LTX Docs](https://www.pixazo.ai/models/ltx)               |
| **Text to Video**        | Pixazo AI (`LTX Video`)               | High-definition video generation from descriptive prompts   | [Pixazo LTX Docs](https://www.pixazo.ai/models/ltx)               |
| **Background Remover**   | Remove.bg REST API                    | Multipart subject extraction & background removal           | [Remove.bg API](https://www.remove.bg/api)                        |
| **Text to Speech (TTS)** | Edge TTS Universal                    | Neural voice synthesis across multiple presets & pitch/rate | [Edge-TTS Docs](https://www.npmjs.com/package/edge-tts-universal) |
| **AI Chatbot**           | Groq Cloud (`gpt-oss-120b` / `Llama`) | Low-latency conversational LLM with SSE streaming           | [Groq Overview](https://console.groq.com/docs/overview)           |
| **Text to Image**        | Hugging Face (`FLUX.1-schnell`)       | High-speed 5-step diffusion image generation                | [Hugging Face Docs](https://huggingface.co/)                      |
| **Resume Analyzer**      | Groq Cloud + `pdf-parse` + `pdfkit`   | ATS scoring, keyword extraction, and PDF generation         | [Groq Overview](https://console.groq.com/docs/overview)           |
| **Cloud Storage**        | Cloudinary SDK                        | Cloud image/video/audio asset hosting & CDN delivery        | [Cloudinary Docs](https://cloudinary.com/documentation)           |
| **Payment Gateway**      | Stripe                                | Global payment checkouts and webhook processing             | [Stripe Docs](https://stripe.com/docs)                            |

---

## 🛠️ 3. Tech Stack & Architecture

| Layer                   | Technology                  | Purpose                                                   |
| :---------------------- | :-------------------------- | :-------------------------------------------------------- |
| **Runtime**             | Bun                         | Fast JavaScript / TypeScript runtime & package management |
| **Web Framework**       | Express.js 5 + TypeScript   | Clean, modular REST routing with strict typing            |
| **ORM & Database**      | Prisma 7 + PostgreSQL       | Multi-file schema database modeling with transactions     |
| **Authentication**      | Better-Auth + JWT           | Secure cookie management, Google OAuth & token signing    |
| **Validation**          | Zod                         | Request body and query parameter validation               |
| **Security**            | Helmet, CORS, Rate-Limiting | API security and endpoint throttling                      |
| **Document Processing** | `pdf-parse` & `pdfkit`      | Resume PDF parsing and dynamic PDF generation             |
| **Emails**              | Nodemailer + EJS            | Transactional and verification email dispatching          |

---

## 📁 4. Folder Structure

```
server/
├── prisma/
│   ├── schema/                      # Modular multi-file Prisma schemas
│   │   ├── auth.prisma              # User, Account, Session schemas
│   │   ├── generated.prisma         # Generic generation parent model
│   │   ├── textToImage.prisma       # Text-to-image logs
│   │   ├── textToVideo.prisma       # Text-to-video logs
│   │   ├── imageToVideo.prisma      # Image-to-video logs
│   │   ├── textToSpeech.prisma      # TTS audio records
│   │   ├── aiChat.prisma            # Chat conversation histories
│   │   ├── resume.prisma            # Resume analysis & ATS logs
│   │   ├── payment.prisma           # Payments and transactions
│   │   └── subscription.prisma      # Subscription tiers & active plans
│   ├── migrations/                  # Database migration files
│   └── schema.prisma                # Prisma root config
├── src/
│   ├── app/
│   │   ├── config/                  # Environment variables & third-party configs
│   │   ├── middleware/              # Auth guards, error handlers, rate limiters
│   │   ├── modules/                 # Feature-based domain modules
│   │   │   ├── admin/               # Admin management and metrics
│   │   │   ├── ai-chat-bot/         # SSE streaming chatbot
│   │   │   ├── auth/                # Better-auth and JWT handlers
│   │   │   ├── background-remover/  # Remove.bg processing
│   │   │   ├── dashboard/           # User dashboard statistics
│   │   │   ├── history/             # Generation history aggregation
│   │   │   ├── image-to-video/      # Pixazo image-to-video pipeline
│   │   │   ├── notification/        # System notification center
│   │   │   ├── pricePlan/           # Pricing plan configurations
│   │   │   ├── resume-analyzer/     # ATS scoring and PDF generator
│   │   │   ├── subscription/        # Stripe & SSLCommerz checkout
│   │   │   ├── text-to-image/       # Hugging Face FLUX.1 generator
│   │   │   ├── text-to-speech/      # Edge-TTS audio synthesizer
│   │   │   ├── text-to-video-pixazo/# Pixazo text-to-video pipeline
│   │   │   └── webhook/             # Webhook receivers for Stripe & SSLCommerz
│   │   ├── routes/                  # Central router aggregating all modules
│   │   ├── shared/                  # Standard response wrapper (`sendResponse`)
│   │   └── utils/                   # Cloudinary uploader, seedAdmin, helpers
│   ├── app.ts                       # Express application bootstrap
│   └── index.ts                     # Server entry point
├── package.json
└── tsconfig.json
```

---

## ⚙️ 5. Environment Variables Setup

Create a `.env` file in the `server/` root directory:

```env
# Server
PORT=5000
NODE_ENV="development"
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai_studio_db?schema=public"
FRONTEND_URL="http://localhost:3000"
BACKEND_SERVER_URL="http://localhost:5000"

# Authentication & JWT
BETTER_AUTH_SECRET="your_better_auth_secret_key"
BETTER_AUTH_URL="http://localhost:5000"
ACCESS_TOKEN_SECRET="your_jwt_access_secret_key"
REFRESH_TOKEN_SECRET="your_jwt_refresh_secret_key"
ACCESS_TOKEN_EXPIRES_IN="1d"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_oauth_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_oauth_client_secret"

# Hugging Face (FLUX.1-schnell Text to Image)
HP_TOKEN="hf_your_huggingface_access_token"

# Pixazo AI (LTX Video Generation)
PIXAZO_SUBSCRIPTION_KEY="your_pixazo_subscription_key"

# Groq Cloud (AI Chatbot & Resume Analyzer)
GROQ_API_KEY_AI_CHAT="gsk_your_groq_ai_chat_key"
GROQ_API_KEY_RESUME_ANALYZER="gsk_your_groq_resume_key"

# Google Gemini API (Fallback / Resume Analyzer)
GEMINI_API_KEY="your_google_gemini_api_key"

# Remove.bg (Background Remover)
BACKGROUND_REMOVE_API_KEY="your_remove_bg_api_key"

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
CLOUDINARY_UPLOAD_PRESET="your_upload_preset"

# Stripe Subscriptions
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"
STRIPE_MONTLY_PRODUCT_ID="price_your_monthly_plan_id"
STRIPE_YEARLY_PRODUCT_ID="price_your_yearly_plan_id"

# Initial Admin Seeding
ADMIN_NAME="Admin User"
ADMIN_EMAIL="admin@aistudio.com"
ADMIN_PASSWORD="SecureAdminPassword123!"

# Nodemailer SMTP Configuration
EMAIL_SENDER_SMTP_HOST="smtp.gmail.com"
EMAIL_SENDER_SMTP_PORT=587
EMAIL_SENDER_SMTP_USER="your_email@gmail.com"
EMAIL_SENDER_SMTP_PASS="your_app_password"
EMAIL_SENDER_SMTP_FROM="AI Generate Studio <noreply@aistudio.com>"
```

---

## 🚀 6. Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Database Migration & Prisma Setup

```bash
# Generate Prisma Client
bun run generate

# Run migrations on PostgreSQL
bun run migrate

# (Optional) Seed the default Admin user
bun run seed:admin

# (Optional) Inspect database with Prisma Studio GUI
bun run studio
```

### 3. Start Server

```bash
# Development mode with hot-reloading
bun run dev

# Build production bundle
bun run build

# Start production server
bun run start
```

---

## 📡 7. Comprehensive API Catalog (`/api/v1`)

### 7.1 Authentication (`/auth`)

| Method | Endpoint         | Description                             | Auth Required |
| :----- | :--------------- | :-------------------------------------- | :------------ |
| `POST` | `/auth/register` | Register a new user account             | No            |
| `POST` | `/auth/login`    | Log in and receive JWT / cookie session | No            |
| `GET`  | `/auth/me`       | Retrieve profile and daily quotas       | Yes           |
| `POST` | `/auth/logout`   | Clear cookie sessions                   | Yes           |

### 7.2 AI Generation Endpoints

| Method | Endpoint                           | Description                                 | Engine / Model      |
| :----- | :--------------------------------- | :------------------------------------------ | :------------------ |
| `POST` | `/text-to-image/generate`          | Generate photorealistic image from text     | Hugging Face FLUX.1 |
| `GET`  | `/text-to-image/recent`            | Get 5 most recent image generations         | Database            |
| `POST` | `/text-to-video/generate`          | Queue text-to-video generation              | Pixazo LTX Video    |
| `POST` | `/image-to-video/generate`         | Upload image & queue video animation        | Pixazo LTX Video    |
| `POST` | `/image-to-video/webhook/callback` | Async webhook receiver for completed videos | Pixazo Callback     |
| `POST` | `/background-remove/remove`        | Extract subject & remove image background   | Remove.bg API       |
| `POST` | `/text-to-speech/generate`         | Synthesize neural speech from text          | Edge TTS Universal  |
| `POST` | `/ai-chat-bot/chat-stream`         | Real-time streaming conversation (SSE)      | Groq Cloud          |
| `POST` | `/resume-analyzer/analyze`         | Parse PDF resume & calculate ATS score      | Groq / Gemini       |
| `POST` | `/resume-analyzer/generate-pdf`    | Build structured ATS resume PDF             | `pdfkit`            |

### 7.3 Subscriptions, Dashboard & Admin

| Method | Endpoint                                | Description                                    | Role    |
| :----- | :-------------------------------------- | :--------------------------------------------- | :------ |
| `POST` | `/subscription/create-checkout-session` | Create Stripe checkout session                 | User    |
| `POST` | `/subscription/stripe-webhook`          | Ingest Stripe subscription webhooks            | Webhook |
| `POST` | `/subscription/sslcommerz/init`         | Initiate SSLCommerz checkout session           | User    |
| `GET`  | `/dashboard/stats`                      | Retrieve quota counts and generation summaries | User    |
| `GET`  | `/history`                              | Paginated full generation history              | User    |
| `GET`  | `/admin/users`                          | List, manage, and toggle user accounts         | Admin   |
| `GET`  | `/admin/payments`                       | Payment logs and revenue records               | Admin   |

---

## 🛡️ 8. Security & Engineering Highlights

- **Background Async Operations**: Cloudinary media uploads and database log writes are executed asynchronously using `setImmediate` and Prisma transactions to guarantee ultra-fast HTTP response times.
- **SSE Streaming**: Token streaming for the AI chatbot provides instantaneous response feedback with zero client polling.
- **Webhook Idempotency**: Stripe and Pixazo webhooks are securely validated against request signatures and unique request IDs before modifying user records.
