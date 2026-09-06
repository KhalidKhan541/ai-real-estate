# AI Real Estate Platform

An AI-powered real estate platform with virtual tours, smart search, intelligent property matching, and comprehensive mortgage tools.

## Features

- **AI-Powered Valuations** - Get accurate property valuations using machine learning
- **Smart Search** - Find properties with AI-enhanced search and filters
- **Virtual Tours** - Interactive 3D property tours with hotspot navigation
- **Mortgage Calculator** - Full amortization schedules and pre-approval estimates
- **Market Analysis** - Real-time market trends and investment scoring
- **Recommendation Engine** - Personalized property recommendations
- **Agent Management** - Agent profiles, ratings, and verification
- **Transaction Tracking** - Complete transaction lifecycle management
- **Offer Management** - Create, counter, accept, and track offers

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Cache**: Redis
- **AI**: OpenAI, Anthropic, Google Gemini
- **Maps**: Mapbox GL
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions
- **Containerization**: Docker

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ai-real-estate.git
cd ai-real-estate

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Docker

```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.prod.yml up -d
```

## Development

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix lint errors
npm run typecheck    # Run TypeScript compiler
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run format       # Format code with Prettier
```

## Testing

The project includes comprehensive tests:

- **Unit Tests**: Service layer, utilities, validators, permissions
- **Component Tests**: React component rendering and interactions
- **Integration Tests**: End-to-end service workflows

```bash
npm test                    # Run all tests
npm run test:coverage       # Run with coverage report
npm run test:watch          # Watch mode
```

### Test Structure

```
tests/
  unit/
    properties/     # Property service tests
    listings/       # Listing service tests
    search/         # Search service tests
    agents/         # Agent service tests
    offers/         # Offer service tests
    transactions/   # Transaction service tests
    ai/             # AI service tests (valuation, market, recommendations)
    mortgage/       # Mortgage calculator tests
    lib/            # Validators and permissions tests
    virtual-tours/  # Virtual tour service tests
  component/
    properties/     # PropertyCard tests
    search/         # SearchFilters tests
    agents/         # AgentCard tests
    mortgage/       # Calculator tests
    virtual-tours/  # TourViewer tests
  integration/
    api/            # API integration tests
```

## Project Structure

```
src/
  app/              # Next.js App Router
    (auth)/         # Authentication pages
    (dashboard)/    # Dashboard pages
    api/            # API routes
  components/       # React components
    agents/         # Agent-related components
    layout/         # Layout components
    mortgage/       # Mortgage calculator
    neighborhoods/  # Neighborhood components
    offers/         # Offer components
    properties/     # Property components
    search/         # Search components
    shared/         # Shared components
    virtual-tours/  # Virtual tour components
  lib/              # Utility functions and services
    ai/             # AI services (valuation, market, recommendations)
    documents/      # Document handling
    market/         # Market data
    mortgage/       # Mortgage calculations
    offers/         # Offer management
    payments/       # Payment processing
    reviews/        # Review system
    transactions/   # Transaction management
  store/            # Zustand state management
  types/            # TypeScript types
```

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `STRIPE_SECRET_KEY` - Stripe for payments

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/properties` - List properties
- `POST /api/properties` - Create property
- `GET /api/properties/:id` - Get property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `GET /api/listings` - List listings
- `GET /api/search` - Search properties
- `POST /api/offers` - Create offer
- `POST /api/ai/valuation` - Get AI valuation
- `POST /api/ai/recommendations` - Get recommendations

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.
