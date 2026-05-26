# GeoTrade Nexus

A comprehensive B2B marketplace platform for global mineral trading, connecting miners, buyers, logistics providers, and financial institutions in a secure, AI-powered ecosystem.

## 🌍 About the Project

GeoTrade Nexus is a next-generation digital marketplace designed specifically for the mineral trading industry. The platform facilitates secure transactions between mining companies, buyers, logistics providers, and other stakeholders while ensuring compliance, transparency, and efficiency in global mineral trade.

### Key Value Propositions

- **Secure Trading**: Escrow-protected transactions with multi-party verification
- **AI-Powered Intelligence**: Market insights, compliance verification, and automated product descriptions
- **Global Logistics**: Integrated shipping and warehouse management
- **Regulatory Compliance**: Automated mining license and certification verification
- **Real-time Analytics**: Comprehensive dashboards for all stakeholder roles

## 🎯 Core Features

### 🏢 User & Company Management

- Multi-role user registration and onboarding
- Company profile creation and verification
- Mining license compliance verification
- Two-factor authentication (2FA)
- Role-based access control (RBAC)

### 📦 Product & Inventory Management

- Detailed mineral product listings (grade, purity, quantity, origin)
- Real-time inventory tracking
- Quality certification management
- Automated product description generation (AI-powered)

### 🔍 Marketplace & Discovery

- Advanced search and filtering system
- Mineral-specific technical filters (chemical composition, physical specs)
- Supplier verification and rating system
- Saved searches with automated alerts

### 💼 RFQ (Request for Quotation) System

- Structured procurement request creation
- Competitive bidding platform
- Side-by-side quotation comparison
- Negotiation workflow management
- Automatic order conversion

### 📋 Order & Contract Management

- Direct purchase processing
- Bulk order handling
- Long-term supply contract management
- Auction and tender bidding support

### 🚚 Logistics & Shipment Tracking

- Multi-modal transport booking (truck, rail, sea, container)
- Real-time shipment tracking
- Freight rate calculation
- Delivery milestone management

### 🏭 Warehouse Operations

- Warehouse registration and management
- Inventory control and stock alerts
- Inbound/outbound shipment processing
- Quality inspection record keeping

### 💰 Payment & Escrow System

- Multi-payment method support (Stripe, PayPal, Bank Transfer, LC)
- Milestone-based escrow protection
- Automated commission processing
- Multi-currency support with real-time conversion

### ⚖️ Dispute Resolution

- Structured dispute management workflow
- Evidence collection and review system
- Admin-mediated resolution process
- Escrow fund control during disputes

### 💬 Communication & Notifications

- In-platform messaging system
- Real-time notification delivery
- Role-specific alert management
- Integration with external communication channels

### 🤖 AI-Powered Tools

- **Product Description Generator**: Creates standardized descriptions from specifications
- **Compliance Verification**: Automated document and license verification
- **Market Intelligence**: Trend analysis, pricing insights, and demand forecasting
- **Fraud Detection**: Anomaly detection for pricing and document verification

## 👥 User Roles & Permissions

### 🔐 Administrative Roles

| Role                   | Permissions                                                    | Responsibilities                                  |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| **Super Admin**        | Full platform access, system configuration                     | Platform governance, root-level settings          |
| **Compliance Officer** | Company verification, license validation, product moderation   | Ensuring regulatory compliance and legitimacy     |
| **Finance Manager**    | Payment oversight, escrow management, commission settings      | Financial operations and revenue management       |
| **Support Lead**       | User management, dispute resolution, messaging oversight       | Customer satisfaction and conflict resolution     |
| **Logistics Admin**    | Carrier management, warehouse oversight, shipment coordination | Supply chain integrity and logistics optimization |

### 🏭 Business Roles

| Role                   | Access Level                                            | Key Features                                      |
| ---------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| **Seller/Miner**       | Product management, order fulfillment, analytics        | Create listings, manage inventory, fulfill orders |
| **Buyer/Trader**       | Marketplace browsing, RFQ creation, order management    | Search products, create RFQs, place orders        |
| **Logistics Provider** | Shipment management, tracking, rate calculation         | Manage deliveries, provide tracking updates       |
| **Warehouse Operator** | Inventory control, quality inspection, stock management | Handle storage, conduct inspections               |
| **Finance Partner**    | Payment processing, escrow management                   | Process payments, manage financial transactions   |

## 🏗️ Project Structure

```
nextn/
├── 📁 .github/                    # GitHub workflows and templates
├── 📁 .idx/                       # IDX configuration files
├── 📁 docs/                       # Comprehensive system documentation
│   ├── blueprint.md               # Core project blueprint and style guide
│   ├── admin-system-design.md     # Admin panel architecture
│   ├── api-integration-design.md  # API and third-party integrations
│   ├── rfq-system-design.md       # RFQ marketplace system
│   ├── finance-system-design.md   # Payment and escrow architecture
│   ├── search-system-design.md    # Search and filtering system
│   └── [other-system-designs].md  # Additional system specifications
├── 📁 src/
│   ├── 📁 ai/                     # AI services and flows
│   │   ├── flows/                 # AI workflow definitions
│   │   ├── dev.ts                 # Development AI configuration
│   │   └── genkit.ts              # Google Genkit AI integration
│   ├── 📁 app/                    # Next.js app router pages
│   │   ├── admin/                 # Admin panel pages
│   │   ├── dashboard/             # User dashboards
│   │   ├── marketplace/           # Marketplace pages
│   │   ├── search/                # Search functionality
│   │   ├── trade/                 # Trading interfaces
│   │   └── [other-routes]/        # Additional application routes
│   ├── 📁 components/             # React components
│   │   ├── admin/                 # Admin-specific components
│   │   ├── analytics/             # Analytics and reporting components
│   │   ├── compliance/            # Compliance-related components
│   │   ├── dashboard/             # Dashboard components
│   │   ├── layout/                # Layout and navigation components
│   │   ├── marketplace/           # Marketplace-specific components
│   │   ├── shared/                # Shared/common components
│   │   └── ui/                    # Base UI components (shadcn/ui)
│   ├── 📁 hooks/                  # Custom React hooks
│   │   ├── use-inventory.ts       # Inventory management hook
│   │   ├── use-leads.ts           # Lead management hook
│   │   ├── use-orders.ts          # Order management hook
│   │   └── use-toast.ts           # Toast notification hook
│   ├── 📁 lib/                    # Utility libraries and configurations
│   │   ├── env.ts                 # Environment configuration
│   │   ├── monitoring.ts          # Application monitoring
│   │   ├── utils.ts               # General utilities
│   │   └── [other-utils].ts       # Additional utility files
│   └── 📁 services/               # Business logic and API services
│       ├── inventory-service.ts   # Inventory management service
│       ├── lead-service.ts        # Lead management service
│       └── order-service.ts       # Order processing service
├── 📄 package.json                # Dependencies and scripts
├── 📄 next.config.ts              # Next.js configuration
├── 📄 tailwind.config.ts          # Tailwind CSS configuration
├── 📄 tsconfig.json               # TypeScript configuration
└── 📄 components.json             # shadcn/ui component configuration
```

## 🛠️ Technology Stack

### Frontend

- **Framework**: Next.js 15.5.9 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts for analytics visualization
- **Forms**: React Hook Form with Zod validation

### Backend & Services

- **Runtime**: Node.js with TypeScript
- **AI Integration**: Google Genkit with Gemini AI
- **Database**: Firebase (implied from dependencies)
- **Authentication**: Firebase Auth with 2FA support
- **File Storage**: Firebase Storage

### Development Tools

- **Linting**: ESLint with TypeScript support
- **Package Manager**: npm/pnpm
- **Build Tool**: Next.js with Turbopack
- **Development Server**: Custom port 9002

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm package manager
- Firebase project setup
- Google AI API access for Genkit integration

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd nextn
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with required environment variables:

   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

   # Google AI Configuration
   GOOGLE_AI_API_KEY=your_genkit_api_key

   # Other required environment variables
   ```

4. **Start Development Server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:9002`

5. **Start AI Development Server** (Optional)
   ```bash
   npm run genkit:dev
   ```

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit with file watching

## 🔧 Configuration

### Design System

- **Primary Color**: Deep Blue (#1B4498) - Trust and professionalism
- **Background**: Light Grey-Blue (#ECF0F5) - Clean and readable
- **Accent Color**: Vibrant Aqua (#21CEDD) - Modern highlights
- **Typography**: Inter font family for optimal readability
- **Layout**: Grid-based with card designs for data organization

### API Integration

- **Versioning**: URI-based with header support (`/api/v1/`)
- **Authentication**: JWT for users, API keys for third-party integrations
- **Rate Limiting**: Tiered based on user level (1K-10K requests/minute)
- **Security**: IP whitelisting for critical integrations

## 📊 Monitoring & Analytics

The platform includes comprehensive monitoring for:

- **Performance**: API latency and response times
- **Security**: Fraud detection and anomaly monitoring
- **Business**: Transaction volumes and user engagement
- **System Health**: Integration status and error rates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use the established component structure
- Maintain comprehensive documentation
- Ensure accessibility compliance
- Write tests for new features

## 📝 License

This project is proprietary software. All rights reserved.

## 📞 Support

For technical support or business inquiries:

- Documentation: Check the `/docs` folder for detailed system designs
- Issues: Use GitHub Issues for bug reports and feature requests
- Contact: [Contact information to be added]

---

**GeoTrade Nexus** - Revolutionizing Global Mineral Trade Through Technology
