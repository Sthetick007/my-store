# TeleShop - Telegram E-commerce WebApp

A complete full-stack Telegram WebApp e-commerce wallet application built with modern web technologies.

## 🚀 Features

### 🛍️ E-commerce
- Product catalog with search and filtering
- Shopping cart management
- Real-time inventory tracking
- Category-based organization (OTT, VPN, Others)

### 💰 Digital Wallet
- Balance management with decimal precision
- Transaction history with filtering
- Multiple payment methods (UPI, QR codes)
- Admin approval system for deposits

### 🔐 Authentication
- Telegram WebApp native integration
- Session management with PostgreSQL storage
- Role-based access control (User/Admin)
- Automatic user creation from Telegram data

### 🤖 Telegram Bot Integration
- Rich command interface (/start, /store, /wallet, /help)
- Inline keyboards with WebApp buttons
- Deep linking support
- Callback query handling

### 👨‍💼 Admin Panel
- User management and analytics
- Product CRUD operations
- Transaction oversight and approval
- Revenue tracking and reporting

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **shadcn/ui** components with Tailwind CSS
- **TanStack Query** for server state management
- **wouter** for lightweight routing

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Neon serverless
- **Drizzle ORM** for type-safe database operations
- **node-telegram-bot-api** for bot integration

### Database
- **PostgreSQL** with the following tables:
  - `users` - User profiles and authentication
  - `products` - E-commerce catalog
  - `carts` - Shopping cart items
  - `transactions` - Financial records
  - `sessions` - Authentication sessions

## 🚀 Quick Start

### 1. Setup
```bash
npm run setup
```

### 2. Environment Configuration
Update `.env` with your values:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/teleshop
SESSION_SECRET=your-super-secret-session-key
TELEGRAM_BOT_TOKEN=your-bot-token-here
WEBAPP_URL=https://your-app.replit.app
```

### 3. Development
```bash
npm run dev
```

### 4. Database Management
```bash
# Update schema
npm run db:push

# Seed sample data
npm run seed
```

## 📱 Telegram Bot Setup

1. Create a bot with [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Set up webhook (production) or use polling (development)
4. Configure WebApp URL in bot settings

### Bot Commands
- `/start` - Welcome message with main menu
- `/store` - Browse product catalog
- `/wallet` - Access digital wallet
- `/help` - Show help information

## 🔧 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # TypeScript type checking
npm run db:push      # Update database schema
npm run seed         # Seed sample data
npm run test:auth    # Test authentication system
```

## 🏗️ Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Route components
│   │   └── types/         # TypeScript definitions
├── server/                # Express backend
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   ├── telegramAuth.ts    # Telegram authentication
│   ├── telegramBot.ts     # Bot command handlers
│   └── db.ts              # Database connection
├── shared/                # Shared code
│   └── schema.ts          # Database schema & types
└── scripts/               # Automation scripts
    ├── setup.js           # Project setup
    ├── seed.js            # Database seeding
    └── test-auth.js       # Authentication testing
```

## 🔒 Security Features

- HMAC signature verification for Telegram data
- Session-based authentication with PostgreSQL storage
- Role-based access control for admin functions
- Input validation and sanitization
- CORS headers for cross-origin requests

## 🚀 Deployment

### Environment Variables
```env
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
TELEGRAM_BOT_TOKEN=your-bot-token
WEBAPP_URL=https://your-domain.com
NODE_ENV=production
```

### Build & Deploy
```bash
npm run build
npm start
```

## 📊 Admin Features

- **User Management**: View all users, balances, and roles
- **Product Management**: Add, edit, delete products
- **Transaction Oversight**: Approve/reject deposits
- **Analytics**: Revenue tracking and user metrics
- **Messaging**: Send product credentials to users

## 🎨 UI/UX Features

- **Dark Theme**: Optimized for Telegram's interface
- **Glassmorphism**: Modern visual effects
- **Mobile-First**: Responsive design for all devices
- **Haptic Feedback**: Native Telegram WebApp feedback
- **Loading States**: Smooth user experience
- **Error Handling**: Comprehensive error management

## 🔄 Data Flow

1. **Authentication**: Users authenticate via Telegram WebApp
2. **Product Browsing**: Products fetched from PostgreSQL
3. **Cart Management**: Real-time cart updates
4. **Transactions**: Admin approval workflow
5. **Notifications**: Telegram bot notifications

## 📈 Monitoring

- Health check endpoint: `/api/health`
- Request logging with duration tracking
- Error tracking and reporting
- Database connection monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Email: support@teleshop.com
- Telegram: @yoursupport
- Documentation: [GitHub Wiki](https://github.com/yourrepo/wiki)

---

Built with ❤️ for the Telegram ecosystem