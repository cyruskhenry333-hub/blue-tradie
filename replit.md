# Blue Tradie - AI-Powered Business Management Platform

## Overview
Blue Tradie is an AI-powered business management platform designed for trade professionals in Australia and New Zealand. Its primary purpose is to streamline business operations through intelligent user journey tracking and efficient onboarding processes. The platform aims to provide comprehensive tools for managing various aspects of a trade business, including invoicing, payment processing, and customer relationship management, leveraging AI for enhanced efficiency and user experience.

## User Preferences
*No specific user preferences documented yet*

## System Architecture
The platform utilizes a unified authentication system that supports both standard Replit Auth and a dedicated demo user flow. Demo users are granted elevated permissions and unrestricted platform access after a streamlined login process. The system ensures the `/onboarding` route is universally accessible to facilitate seamless user setup.

Core technical implementations include:
- Robust session handling and database-driven authentication for both live and demo users.
- A secure admin dashboard (`/internal/signups`) for monitoring VIP waitlist and demo user signups, protected by basic authentication.
- Integration with Stripe for comprehensive invoice payment processing, including secure checkout sessions, webhook event handling, and email automation via SendGrid.
- Production readiness features such as Sentry monitoring for error tracking, a `/health` endpoint for system status, and automated version tracking.
- Comprehensive Playwright E2E tests for critical user flows like demo login and invoice payments.
- A secure password gate for `www.bluetradie.com` for controlled private testing, employing session-based authentication and environment variable control.

UI/UX decisions focus on:
- A clear distinction between the public marketing landing page and the application dashboard. The root URL `/` serves a marketing landing page, while the demo request form is accessible at `/demo-request`.
- A professional and branded interface for the password gate, featuring a responsive design with a gradient background and glassmorphism elements.

## External Dependencies
- **Stripe**: Used for payment processing, including creating checkout sessions, handling webhooks (e.g., `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`), and managing payment-related database updates.
- **SendGrid**: Integrated for email automation, specifically for sending invoices with payment buttons and generating professional PDF invoices.
- **Sentry**: Utilized for application monitoring and error tracking, both on the server-side (`@sentry/node`) and client-side (`@sentry/react`), with release tracking and environment-specific filtering.
- **Playwright**: Employed for end-to-end (E2E) testing of critical user flows.