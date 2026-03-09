# FlowFi / LiquidFlow

**DeFi Payment Streaming on Stellar**

*Programmable, real-time payment streams and recurring subscriptions powered by Soroban smart contracts.*

## Overview

FlowFi (also known as LiquidFlow) is a comprehensive DeFi platform built on the Stellar network that enables continuous payment streams and recurring subscriptions using stablecoins. By leveraging Soroban smart contracts, FlowFi provides autonomous, accurate-to-the-second distribution of funds for use cases like salary payments, service subscriptions, and yield farming.

## Architecture

FlowFi consists of three main components:

- **Frontend**: Next.js application with React, TypeScript, and Tailwind CSS
- **Backend**: Express.js API with TypeScript, Prisma ORM, and PostgreSQL
- **Smart Contracts**: Soroban contracts written in Rust for on-chain logic

## Features

- **Real-time Streaming**: Pay by the second for services or salaries
- **Recurring Subscriptions**: Automate monthly or weekly payments
- **Soroban Powered**: Secure and efficient execution on Stellar's smart contract platform
- **Modern Tech Stack**: React 19, Next.js 16, TypeScript, Express.js, Prisma
- **Docker Support**: Containerized deployment with Docker Compose
- **Developer Tools**: Comprehensive API documentation with Swagger

## Project Structure

```
flowfi/
├── backend/                    # Express.js + TypeScript backend
│   ├── src/
│   │   ├── app.ts             # Main application setup
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── lib/               # Utility libraries
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   └── validators/        # Input validation schemas
│   ├── prisma/                # Database schema and migrations
│   ├── devOps/                # Docker and deployment configs
│   └── tests/                 # Backend test suite
├── contracts/                 # Soroban smart contracts
│   ├── stream_contract/       # Core streaming logic contract
│   └── Cargo.toml             # Rust workspace configuration
├── frontend/                  # Next.js + Tailwind CSS frontend
│   ├── app/                   # Next.js app router pages
│   ├── components/            # Reusable React components
│   ├── context/               # React context providers
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   └── public/                # Static assets
├── .github/                   # GitHub workflows and templates
└── CONTRIBUTING.md            # Detailed contribution guidelines
```

## Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Git**

### For Smart Contract Development
- **Rust** (latest stable version)
- **Cargo** (comes with Rust)

### For Local Development
- **Docker** & **Docker Compose** (recommended for full stack)
- **PostgreSQL** (if not using Docker)

### Optional
- **Stellar CLI** (for contract deployment and interaction)
- **Prisma Studio** (for database management)

## Quick Start

### Option 1: Docker (Recommended)

The fastest way to run the complete FlowFi stack locally:

1. **Clone and navigate to the project:**
   ```bash
   git clone <repository-url>
   cd LiquidFlow
   ```

2. **Set up environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Start all services:**
   ```bash
   cd backend/devOps/docker
   docker compose up --build
   ```

This starts:
- **PostgreSQL** database on port `5432`
- **Backend API** on port `3001`
- **Nginx** reverse proxy on ports `80` and `443`

4. **In a separate terminal, start the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

### Option 2: Manual Setup

#### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database and Stellar configuration
   ```

3. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Start the backend:**
   ```bash
   npm run dev
   ```

The backend API will be available at `http://localhost:3001`

#### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

#### Smart Contracts

1. **Build the contracts:**
   ```bash
   cd contracts
   cargo build --target wasm32-unknown-unknown --release
   ```

2. **For contract development and testing:**
   ```bash
   cd stream_contract
   cargo test
   ```

## Development Workflow

### Environment Configuration

Key environment variables in `backend/.env`:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Stellar Network
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# Database
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=liquidflow
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}
```

### Database Management

- **View database:** `npx prisma studio`
- **Generate migrations:** `npx prisma migrate dev`
- **Reset database:** `npx prisma migrate reset`
- **Generate Prisma client:** `npx prisma generate`

### API Documentation

Once the backend is running, visit `http://localhost:3001/api-docs` for interactive Swagger documentation.

### Testing

- **Backend tests:** `cd backend && npm test`
- **Contract tests:** `cd contracts && cargo test`
- **Frontend tests:** `cd frontend && npm test` (if configured)

## Docker Commands

### Development

```bash
# Start all services
docker compose up --build

# Start in detached mode
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down

# Stop and remove volumes (reset database)
docker compose down -v

# Rebuild specific service
docker compose up --build backend
```

### Production

For production deployment, use the production Docker Compose configuration:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## Stellar Integration

### Testnet Setup

1. **Install Freighter wallet** browser extension
2. **Switch to Testnet** in Freighter settings
3. **Get testnet tokens** from the Stellar testnet faucet

### Contract Deployment

1. **Build contracts for deployment:**
   ```bash
   cd contracts
   cargo build --target wasm32-unknown-unknown --release
   ```

2. **Deploy using Stellar CLI:**
   ```bash
   stellar contract deploy ./target/wasm32-unknown-unknown/release/stream_contract.wasm \
     --source <your-account> \
     --network testnet
   ```

## Troubleshooting

### Common Issues

1. **Port conflicts:** Ensure ports 3000, 3001, and 5432 are available
2. **Database connection:** Verify PostgreSQL is running and credentials are correct
3. **Stellar network:** Ensure you're using the correct network (testnet/mainnet)
4. **Contract build failures:** Verify Rust and wasm32 target are installed

### Getting Help

- Check the [GitHub Issues](https://github.com/your-org/FlowFi/issues) for known problems
- Review the [Contributing Guide](./CONTRIBUTING.md) for development guidelines
- Join our community discussions for support

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for detailed guidelines on:

- Bug reporting procedures
- Pull request submission process
- Code style and standards
- External developer guidelines

### Quick Links for Contributors

- [Bug Report Template](./.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature Request Template](./.github/ISSUE_TEMPLATE/feature_request.md)
- [Pull Request Template](./.github/pull_request_template.md)

## Tech Stack Details

### Frontend
- **Framework:** Next.js 16 with App Router
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **TypeScript:** Full type safety
- **Stellar Integration:** Soroban React, Freighter API
- **Icons:** Lucide React
- **State Management:** React Context

### Backend
- **Runtime:** Node.js with ES modules
- **Framework:** Express.js 5
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Validation:** Zod schemas
- **Logging:** Winston
- **Documentation:** Swagger/OpenAPI
- **Testing:** Vitest

### Smart Contracts
- **Language:** Rust
- **Platform:** Soroban (Stellar)
- **Build Target:** WASM32

### DevOps
- **Containerization:** Docker & Docker Compose
- **Reverse Proxy:** Nginx
- **Version Control:** Git with Husky hooks
- **CI/CD:** GitHub Actions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Stellar Development Foundation** for the Soroban platform
- **All contributors** who help improve FlowFi
- **Open source community** for the tools and libraries that make this project possible

---

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
