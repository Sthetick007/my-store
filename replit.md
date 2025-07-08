# Telegram E-commerce WebApp

## Overview

This is a full-stack Telegram WebApp e-commerce wallet application built with modern web technologies. The application provides a complete e-commerce experience within Telegram, featuring product browsing, shopping cart management, digital wallet functionality, and transaction history tracking.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool for fast development and optimized builds
- **wouter** for lightweight client-side routing
- **shadcn/ui** components with Tailwind CSS for consistent, modern UI
- **TanStack Query** for efficient server state management and caching
- **Dark theme** with glassmorphism effects optimized for Telegram's interface

### Backend Architecture
- **Express.js** server with TypeScript
- **Replit Authentication** system with OpenID Connect integration
- **PostgreSQL** database with Neon serverless connections
- **Drizzle ORM** for type-safe database operations
- **Session management** with PostgreSQL store and 7-day token expiry

### Database Schema
- **Users**: Core user information with Telegram integration and admin privileges
- **Products**: E-commerce catalog with categories, pricing, and stock management
- **Carts**: Shopping cart items linked to users and products
- **Transactions**: Financial transaction records with status tracking
- **Sessions**: Authentication session storage (required for Replit Auth)

## Key Components

### Authentication System
- **Telegram WebApp Authentication**: Native Telegram integration for seamless user login
- **Session Management**: Express session storage with PostgreSQL backup
- **User Auto-creation**: Automatically creates user profiles from Telegram data on first login
- **Login Logging**: All user authentication attempts are logged with timestamps
- **Admin Role Support**: Role-based access control for administrative functions
- **Real User Data**: Displays actual Telegram user names and profile pictures

### E-commerce Features
- **Product Catalog**: Searchable and filterable product listings
- **Shopping Cart**: Real-time cart management with quantity updates
- **Checkout Process**: Integrated with wallet balance for seamless transactions
- **Inventory Management**: Stock tracking and availability checks

### Wallet System
- **Balance Management**: User balance tracking with decimal precision
- **Transaction History**: Complete audit trail of all financial activities
- **Payment Methods**: UPI and QR code payment options with method selection modal
- **Add Funds Only**: Simplified wallet with only deposit functionality (no withdrawals or send money)
- **Multiple Transaction Types**: Support for deposits, purchases, and refunds

### Admin Panel
- **User Management**: View and manage all registered users
- **Product Management**: CRUD operations for product catalog
- **Transaction Oversight**: Monitor all platform transactions
- **Analytics Dashboard**: Revenue tracking and user activity metrics

## Data Flow

1. **User Authentication**: Users authenticate through Replit's OAuth system
2. **Product Browsing**: Products are fetched from PostgreSQL and cached client-side
3. **Cart Management**: Cart operations update both local state and server storage
4. **Wallet Operations**: Balance changes are recorded as transactions in the database
5. **Admin Operations**: Administrative actions are protected by role-based middleware

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection adapter
- **drizzle-orm**: TypeScript ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/react-***: Accessible UI component primitives
- **openid-client**: OpenID Connect authentication client

### Development Tools
- **Vite**: Build tool with HMR and optimized bundling
- **TypeScript**: Static type checking across the entire codebase
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds the React application to `dist/public`
2. **Backend Build**: ESBuild bundles the Express server to `dist/index.js`
3. **Database Migration**: Drizzle pushes schema changes to PostgreSQL

### Environment Requirements
- **DATABASE_URL**: PostgreSQL connection string (Neon serverless)
- **SESSION_SECRET**: Secret key for session encryption
- **REPLIT_DOMAINS**: Allowed domains for Replit authentication
- **ISSUER_URL**: OpenID Connect issuer URL (defaults to Replit)

### Production Deployment
- **Node.js Runtime**: Runs the bundled Express server
- **Static Assets**: Serves the built React application
- **Database**: Connects to Neon PostgreSQL instance
- **Session Storage**: Uses PostgreSQL for session persistence

## Changelog

- July 07, 2025: Created user-focused dashboard with My Products section
  - Replaced admin tab with "My Products" in 3rd position, Settings moved to last
  - Created UserProducts component showing purchased subscriptions with credentials
  - Added small admin toggle button in header for authorized users
  - Integrated real product message data from existing MyProducts component
  - Admin mode now hides bottom navigation and cart functionality
- July 07, 2025: Updated product catalog to subscription services
  - Removed all existing products and replaced with Netflix, Spotify, Disney+ Hotstar
  - Updated categories to OTT, VPN, Others for subscription-based services
  - Changed product display icons to streaming service appropriate icons
  - All products are now subscription-based with monthly pricing
- July 07, 2025: Fixed mobile UI issues in admin panel
  - Improved mobile responsiveness for admin dashboard header and controls
  - Fixed overlapping elements in store view toggle buttons
  - Added proper bottom padding to prevent tab navigation overlap
  - Enhanced transaction table layout for better mobile display
  - Made all admin buttons full-width on mobile devices
- July 07, 2025: Implemented transaction approval system
  - Transactions now require admin approval before balance addition
  - Added pending status for all new transactions
  - Created admin approve/reject functionality with balance updates
  - Updated payment review to explain admin approval requirement
  - Enhanced admin dashboard with transaction management tools
- July 07, 2025: Implemented comprehensive settings and admin system
  - Replaced admin button with user settings page (logout, contact, profile)
  - Created Settings component with transaction history and "My Products"
  - Added PaymentOptions with UPI/Bitcoin methods replacing "add balance"
  - Built AdminDashboard with role-based access control
  - Integrated admin functionality: product management, user messaging
  - Updated navigation: removed history tab, added settings tab
- July 07, 2025: Implemented Telegram WebApp authentication system
  - Created TelegramAuth page with login flow matching Telegram design patterns
  - Added user login logging to console with timestamps
  - Updated Header to display real user names and profile pictures
  - Removed withdraw and send money options from wallet
  - Added UPI and QR payment method selection modal
  - Integrated session management for Telegram authentication
- July 07, 2025: Initial setup with Replit authentication

## User Preferences

Preferred communication style: Simple, everyday language.