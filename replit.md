# Workout Timer Application

## Overview

This is a full-stack workout timer application built with a modern tech stack. The application allows users to create, manage, and execute custom workout timers with configurable intervals, sound settings, and visual feedback. It features a React frontend with TypeScript, an Express.js backend, and PostgreSQL database with Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Custom dark/light mode implementation with localStorage persistence

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with JSON responses
- **Development**: tsx for TypeScript execution in development

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Database Schema
Located in `shared/schema.ts`:
- **workouts** table: Stores workout configurations including timing, sound settings, and ordering
- **timers** table: Stores individual timer intervals associated with workouts
- Zod validation schemas for type safety and runtime validation

### API Endpoints
RESTful API implemented in `server/routes.ts`:
- `GET /api/workouts` - Retrieve all workouts
- `GET /api/workouts/:id` - Get specific workout
- `POST /api/workouts` - Create new workout
- `PATCH /api/workouts/:id` - Update workout
- `PATCH /api/workouts/reorder` - Reorder workouts
- Timer management endpoints for CRUD operations

### Frontend Features
- **Quick Menu**: Rapid workout creation with customizable defaults
- **Workout List**: Drag-and-drop reordering with persistent state
- **Workout Timer**: Real-time countdown with audio cues and visual feedback
- **Settings Management**: Comprehensive sound and display preferences
- **Responsive Design**: Mobile-first approach with touch-friendly interactions

### Audio System
Custom audio hook (`use-audio.tsx`) providing:
- Web Audio API integration for precise timing
- Configurable beep tones and frequencies
- Audio cue scheduling for workout transitions
- Cross-browser compatibility handling

## Data Flow

1. **Workout Creation**: Users create workouts through Quick Menu or detailed editor
2. **Data Persistence**: Workouts stored in PostgreSQL with Drizzle ORM type safety
3. **State Synchronization**: TanStack Query manages client-server state synchronization
4. **Timer Execution**: Real-time countdown with audio/visual feedback
5. **Settings Management**: User preferences stored in localStorage and database

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, React Query)
- Express.js with TypeScript support
- Drizzle ORM with PostgreSQL adapter

### UI/UX Dependencies
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography
- Custom audio management with Web Audio API

### Development Dependencies
- Vite for build tooling and development server
- TypeScript for type safety
- ESBuild for production bundling

## Deployment Strategy

### Development Environment
- Replit configuration for cloud development
- Vite dev server with HMR for rapid iteration
- PostgreSQL provisioned through Replit modules

### Production Build
- Vite builds optimized client bundle to `dist/public`
- ESBuild bundles server code to `dist/index.js`
- Static file serving through Express in production

### Environment Configuration
- DATABASE_URL environment variable for PostgreSQL connection
- NODE_ENV differentiation for development/production modes
- Replit-specific plugins for development experience

## Changelog

Changelog:
- June 15, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.