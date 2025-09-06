# Loyalty System Frontend (Angular)

## Prerequisites

- Node.js 18+
- Angular CLI 17+
- Docker & Docker Compose

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Docker

```bash
# Build and run with Docker Compose
docker-compose up -d --build

# View logs
docker-compose logs -f frontend

# Stop services
docker-compose down
```

## Architecture

### Components Structure
```
src/app/
├── components/
│   ├── atoms/          # Basic reusable components
│   │   ├── button.component.ts
│   │   ├── card.component.ts
│   │   ├── input.component.ts
│   │   └── badge.component.ts
│   └── molecules/      # Composite components
│       ├── form-field.component.ts
│       ├── points-card.component.ts
│       └── chatbot-llm.component.ts
├── pages/              # Page components with lazy loading
│   ├── dashboard/
│   └── login/
├── services/           # Angular services
│   ├── api.service.ts
│   ├── auth.service.ts
│   ├── points.service.ts
│   └── llm.service.ts
├── interceptors/       # HTTP interceptors
└── guards/            # Route guards
```

### Key Features
- ✅ Reactive Forms with validation
- ✅ RxJS for state management
- ✅ Lazy loading modules
- ✅ HTTP interceptors for authentication
- ✅ Tailwind CSS for styling
- ✅ TypeScript strict mode
- ✅ Docker containerization

## API Integration

The frontend communicates with the backend through REST APIs:

- **Authentication**: `/api/auth/login`, `/api/auth/register`
- **Points**: `/api/points/balance`, `/api/points/history`
- **LLM Chat**: `/api/llm/chat`

## Environment Variables

```bash
# API Base URL (configured in services)
API_BASE_URL=/api
```

## Deployment

The application is containerized and can be deployed using Docker Compose. The production build is optimized with Angular CLI's build optimizer.
