# Telegram WebApp E-commerce Store

A full-stack Telegram WebApp e-commerce application with MongoDB backend and Telegram authentication.

## Features

- 🔐 Telegram WebApp Authentication (JWT-based)
- 🛍️ Product catalog with search and categories
- 🛒 Shopping cart functionality
- 💰 Wallet system with balance management
- 📊 Admin dashboard for user and transaction management
- 📱 Mobile-first design optimized for Telegram WebApp

## Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: Telegram WebApp + JWT
- **UI Components**: Radix UI, Shadcn/ui

## Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)
- Telegram Bot Token (get from @BotFather)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd my-store
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/telegram-store

# JWT Secret for authentication  
JWT_SECRET=your-super-secret-jwt-key-here

# Telegram Bot Token (get from @BotFather)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# Port (optional, defaults to 5000)
PORT=5000

# Environment
NODE_ENV=development
```

### 3. Database Setup

Start MongoDB locally or use a cloud service like MongoDB Atlas.

Seed sample products:

```bash
npm run seed:products
```

### 4. Telegram Bot Setup

1. Create a new bot with @BotFather on Telegram
2. Get your bot token and add it to `.env`
3. Set up a WebApp URL pointing to your application
4. Configure menu button or inline keyboard to open the WebApp

### 5. Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### 6. Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   ├── pages/         # Page components
│   │   └── types/         # TypeScript types
├── server/                # Express backend
│   ├── models/           # MongoDB models
│   ├── routes.ts         # API routes
│   ├── telegramAuth.ts   # Telegram authentication
│   ├── mongo-storage.ts  # MongoDB storage layer
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
└── scripts/              # Utility scripts
```

## API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify Telegram WebApp data
- `POST /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - Get products with search/filter
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product

### Shopping Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove cart item
- `DELETE /api/cart` - Clear cart

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create transaction

### Admin (Auth Required)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get admin statistics

## Development Features

- ✅ Hot reload with Vite
- ✅ TypeScript support
- ✅ ESLint configuration
- ✅ Automated error handling
- ✅ Request logging middleware
- ✅ CORS configuration
- ✅ MongoDB connection management

## Authentication Flow

1. User opens Telegram WebApp
2. Frontend sends Telegram initData to `/api/auth/verify`
3. Server validates initData using bot token
4. Server creates/updates user in both JSON storage and MongoDB
5. Server returns JWT token
6. Frontend stores token and makes authenticated requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
