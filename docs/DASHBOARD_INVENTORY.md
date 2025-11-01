# Dashboard Inventory

## Overview
Blue Tradie's dashboard is a React-based SPA that provides tradies with business management tools including quote generation, invoice management, customer tracking, and analytics.

## Pages & Components

### 1. Dashboard Home (`/dashboard`, `/`)
**Purpose**: Central hub with overview cards and quick actions

**Key UI Elements**:
- Welcome card with user greeting and onboarding progress
- Stats cards (total invoices, revenue, pending quotes)
- Recent activity feed
- Quick action buttons (New Quote, New Invoice, View Customers)

**Data Sources**:
- `GET /api/auth/user` - User profile data
- `GET /api/user/stats` - Dashboard statistics
- `GET /api/invoices?recent=true` - Recent activity

**Current State**: Working but needs UX polish
- **Issues**: Stats cards show placeholder data, welcome card needs better styling
- **Missing**: First-run tour, guided onboarding hints

### 2. Onboarding Wizard (`/onboarding`)
**Purpose**: First-time user setup for business profile

**Key UI Elements**:
- Multi-step form (Business Info → Trade Selection → Service Area)
- Progress indicator
- Form validation with error states
- Completion celebration

**Data Sources**:
- `POST /api/user/onboarding` - Save onboarding data

**Current State**: Functional with good UX
- **Working**: Form validation, step progression, data persistence
- **Needs Polish**: Better visual feedback, smoother transitions

### 3. Quote Builder (`/quotes/new`, `/quotes/:id/edit`)
**Purpose**: AI-powered quote generation and customization

**Key UI Elements**:
- Job description input with AI suggestions
- Itemized quote builder (materials, labor, markup)
- Quote preview with professional styling
- PDF export functionality
- Customer selection/creation

**Data Sources**:
- `POST /api/quotes/generate` - AI quote generation
- `GET /api/customers` - Customer lookup
- `POST /api/quotes` - Save quote

**Current State**: Core functionality working
- **Working**: AI generation, PDF export, basic editing
- **Needs Work**: Better mobile responsiveness, improved item management

### 4. Quote Management (`/quotes`)
**Purpose**: View and manage all quotes

**Key UI Elements**:
- Sortable/filterable quote list
- Status badges (Draft, Sent, Accepted, Rejected)
- Quick actions (View, Edit, Send, Convert to Invoice)
- Search and date filtering

**Data Sources**:
- `GET /api/quotes` - Quote list with pagination

**Current State**: Basic list view working
- **Missing**: Advanced filtering, bulk actions, quote templates

### 5. Invoice Management (`/invoices`)
**Purpose**: Track payments and manage invoicing

**Key UI Elements**:
- Invoice list with payment status
- Payment tracking indicators
- Stripe integration for online payments
- Invoice creation from quotes

**Data Sources**:
- `GET /api/invoices` - Invoice list
- `POST /api/invoices/:id/payment-link` - Stripe payment links

**Current State**: Core features implemented
- **Working**: Stripe integration, payment tracking
- **Needs Polish**: Better payment status visualization, overdue alerts

### 6. Customer Management (`/customers`)
**Purpose**: Contact management and customer history

**Key UI Elements**:
- Customer contact cards
- Job history per customer
- Contact information management
- Customer notes and communication log

**Data Sources**:
- `GET /api/customers` - Customer list
- `POST /api/customers` - Add/edit customers

**Current State**: Basic CRUD operations
- **Missing**: Advanced search, communication history, customer insights

### 7. Settings (`/settings`)
**Purpose**: User profile and business configuration

**Key UI Elements**:
- Business profile editing
- Email signature customization
- Notification preferences
- Account management

**Data Sources**:
- `GET /api/user/profile` - User profile
- `PUT /api/user/profile` - Update profile

**Current State**: Basic profile management
- **Missing**: Advanced business settings, integrations, team management

## Design System

### Typography
- **Primary Font**: Inter, system fonts fallback
- **Headings**: Font weights 600-700, good hierarchy
- **Body Text**: Font weight 400-500, good readability

### Colors
- **Primary**: Blue theme (`#3b82f6`, `#1e40af`)
- **Success**: Green (`#10b981`)
- **Warning**: Amber (`#f59e0b`)
- **Error**: Red (`#ef4444`)
- **Neutral**: Gray scale for backgrounds and text

### Layout
- **Grid**: 12-column responsive grid
- **Spacing**: Consistent 8px unit system
- **Containers**: Max-width 1200px with responsive padding
- **Cards**: Consistent border-radius, shadows, and padding

### Components
- **Buttons**: Primary, secondary, and ghost variants
- **Forms**: Good validation styling, consistent spacing
- **Cards**: Professional shadows and spacing
- **Navigation**: Clean sidebar with good active states

## Data Flow & API Integration

### Authentication
- Session-based auth with `bt_sess` cookies
- JWT magic links for login
- Proper 401 handling with redirect to login

### API Patterns
- RESTful endpoints with consistent response format
- Error handling with user-friendly messages
- Loading states managed in React components

### State Management
- React Context for user state
- Local component state for forms
- No global state management (Redux/Zustand)

## Performance & Technical

### Bundle Size
- Single bundle, no code splitting
- React Router for client-side routing
- Vite for fast development builds

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Good touch targets on mobile

### Loading States
- Skeleton loaders for quote generation
- Basic spinner for form submissions
- No error boundaries implemented

## Accessibility

### Current Status
- **Good**: Semantic HTML, keyboard navigation basics
- **Missing**: ARIA labels, screen reader testing, focus management
- **Needs Work**: Color contrast validation, alt text for images

## Empty States & Error Handling

### Empty States
- **Good**: Quote list, customer list have helpful empty states
- **Missing**: Dashboard cards need better empty states when no data

### Error States
- **Working**: Form validation errors are clear
- **Missing**: Network error handling, retry mechanisms
- **Needs Work**: User-friendly error messages for API failures

## Mobile Experience

### Current State
- **Responsive**: Layout adapts well to mobile screens
- **Navigation**: Sidebar collapses appropriately
- **Forms**: Touch-friendly input sizes

### Areas for Improvement
- **Touch Targets**: Some buttons could be larger
- **Scrolling**: Long forms need better mobile UX
- **Offline**: No offline functionality implemented