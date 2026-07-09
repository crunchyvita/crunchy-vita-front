# CrunchyVita Frontend

A modern e-commerce frontend built with **Next.js**, **React**, and **Tailwind CSS**. The application supports multiple languages (English, French) and includes comprehensive features for product browsing, shopping, user authentication, and admin management.


## Features

- 🌍 **Multi-language Support** - English and French localization (i18n)
- 🛒 **E-commerce Platform** - Full shopping cart, checkout, and order management
- 👥 **User Authentication** - Login, registration, password reset
- 🏬 **Admin Dashboard** - Manage products, orders, categories, shipping, and more
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS
- 🎡 **Gamification** - Roulette feature for customer engagement
- 💳 **Payment Integration** - Stripe payment processing
- 📦 **Shipping Integration** - Multi-carrier shipping with Boxtal API
- 🔍 **SEO Optimized** - Sitemap generation with next-sitemap
- 🚀 **Performance Optimized** - Image optimization, code splitting

## Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/)
- **Language**: JavaScript (ES6+)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Context API
- **Internationalization**: Custom i18n setup
- **HTTP Client**: Axios-based API wrapper
- **Authentication**: JWT with secure cookie storage
- **Deployment**: Vercel
- **Build Tool**: Webpack (built-in with Next.js)

## Project Structure

```
crunchy-vita-frontend/
├── src/
│   ├── app/                      # Next.js app directory (App Router)
│   │   ├── [locale]/            # Dynamic locale routes (en, fr)
│   │   ├── admin/               # Admin dashboard pages
│   │   ├── auth/                # Authentication pages (login, register, etc.)
│   │   ├── checkout/            # Checkout flow pages
│   │   ├── api/                 # API routes (contact, emails, products, etc.)
│   │   └── globals.css          # Global styles
│   ├── components/              # React components
│   │   ├── admin/               # Admin-specific components
│   │   ├── email/               # Email template components
│   │   └── ui/                  # Reusable UI components
│   ├── context/                 # React Context providers
│   │   ├── AuthContext.jsx      # Authentication state
│   │   ├── AdminLayoutContext   # Admin layout state
│   │   └── BreadcrumbContext    # Navigation breadcrumbs
│   ├── hooks/                   # Custom React hooks
│   │   ├── useCart.js           # Cart management hook
│   │   └── usePackStorage.js    # Storage tracking hook
│   ├── lib/                     # Utility functions and helpers
│   │   ├── api.js               # API client configuration
│   │   ├── addressCountryConsistency.js
│   │   ├── shippingOfferUi.js   # Shipping display utilities
│   │   └── utils.js             # General utilities
│   ├── messages/                # i18n message files
│   │   ├── en.json              # English translations
│   │   ├── fr.json              # French translations
│   │   └── admin/               # Admin-specific translations
│   ├── i18n.js                  # i18n configuration
│   └── navigation.js            # Next.js internationalized routing
├── public/                       # Static assets
│   ├── robots.txt               # SEO robots configuration
│   ├── sitemap.xml              # Auto-generated sitemap
│   ├── assets/                  # Images and media
│   └── fonts/                   # Custom fonts
├── package.json                 # Dependencies
├── next.config.mjs              # Next.js configuration
├── next-sitemap.config.js       # Sitemap generation config
├── middleware.js                # Next.js middleware for locale detection
├── vercel.json                  # Vercel deployment config
└── jsconfig.json                # JavaScript path aliases

```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running (CrunchyVita backend)
- Environment variables configured

### Installation

1. **Clone the repository**
   ```bash
   cd crunchy-vita-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
  

3. **Run development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.



### Localization

- Locales are defined in `src/i18n.js`
- Translations are in `src/messages/` (en.json, fr.json)
- Routes are dynamically generated with locale prefix: `/en/...`, `/fr/...`
- Language switching is handled via `src/navigation.js`


## Development

### Code Organization

- **Pages**: Located in `src/app/` using Next.js App Router
- **Components**: Reusable React components in `src/components/`
- **Hooks**: Custom hooks in `src/hooks/` for logic reuse
- **Utilities**: Helper functions in `src/lib/` for API calls, formatting, etc.
- **Context**: Global state management in `src/context/`

### API Integration

The API client is configured in `src/lib/api.js`:
- Handles authentication tokens from cookies
- Includes request/response interceptors
- Manages guest ID for unauthenticated users
- Supports both authenticated and guest checkout

### Authentication

- Managed via `AuthContext` in `src/context/AuthContext.jsx`
- JWT tokens stored in secure cookies
- Protected routes via `ProtectedRoute` component
- Guest checkout support with persistent `guestId`



## Key Features

### Admin Dashboard (`/admin`)

- **Products**: Create, edit, delete products with images
- **Categories**: Manage product categories
- **Orders**: View and manage customer orders
- **Shipping**: Configure shipping zones and pricing
- **Customers**: View customer information
- **Reports**: Sales and customer analytics
- **Settings**: System configuration
- **Promo Codes**: Create and manage discount codes

### User Features

- **Shop**: Browse and search products
- **Cart**: Add/remove items, adjust quantities
- **Checkout**: Multi-step checkout with shipping calculation
- **Orders**: View order history and details
- **Profile**: User account management
- **Favorites**: Save favorite products
- **Roulette**: Gamified discount mechanism

### SEO Features

- Auto-generated sitemap (`next-sitemap`)
- Breadcrumb navigation
- Schema markup support



