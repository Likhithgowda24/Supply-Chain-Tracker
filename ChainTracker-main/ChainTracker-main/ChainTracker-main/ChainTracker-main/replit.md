# Supply Chain Tracker - Blockchain-Powered Logistics Platform

## Overview

Supply Chain Tracker is a professional full-stack web application designed for real-time tracking and management of products across the supply chain using blockchain technology. It supports multiple user roles (customers, manufacturers, retailers, suppliers, administrators) with tailored dashboards and features, including product tracking, real-time notifications, an e-commerce shop, CRM, analytics, and AI-powered support. The project aims to provide a transparent and efficient logistics platform with strong market potential.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend uses React with Vite, TypeScript, and Wouter for routing. UI is built with shadcn/ui (on Radix UI primitives) and styled with TailwindCSS, following a "New York" theme with custom color systems and light/dark mode support. State management is handled by TanStack Query for server state and local React state for UI. Framer Motion is used for animations, and react-joyride for interactive tutorials. The design is responsive-first, utilizing component-based architecture and custom hooks.

### Backend Architecture

The backend is built with Express.js and TypeScript, supporting both development (Vite middleware) and production (static serving). It features a session-based authentication system with JWT tokens (access and refresh), bcrypt for password hashing, and multi-role support (Customer, Manufacturer, Retailer, Supplier, Admin). API design is RESTful under `/api`, with authentication middleware and robust error handling.

### Data Architecture

The application uses PostgreSQL (via Drizzle ORM and `pg` driver) for persistent storage of users, products, orders, shipments, addresses, support tickets, and notifications. Blockchain integration is planned using Hardhat and ethers.js for immutable shipment tracking events via a `ShipmentLedger.sol` smart contract. Unique ID generation patterns are implemented for various entities (e.g., `SCT-{timestamp}-{random}` for orders).

### UI/UX Decisions

The UI/UX emphasizes a clean, modern aesthetic using shadcn/ui's "New York" style. Interactive elements include clickable dashboard metrics leading to detail dialogs, product images in shop sections, and live tracking updates with polling. Role-based navigation and metrics ensure a tailored user experience.

## External Dependencies

**UI Component Libraries:** Radix UI, shadcn/ui, Recharts, cmdk, Lucide React.
**Animation & Interaction:** Framer Motion, react-joyride.
**Data Fetching & State:** TanStack Query.
**Authentication & Security:** bcrypt, jsonwebtoken.
**Database & ORM:** Drizzle ORM, `pg` (node-postgres), drizzle-kit.
**Blockchain (Planned):** ethers.js, Hardhat.
**Email & Notifications (Planned):** Nodemailer/SendGrid, Socket.io.
**External APIs (Planned):** Amazon/Flipkart Product APIs, Ship24 API, OpenAI API, SMTP.
**Development Tools:** Vite, esbuild, TypeScript.
**Styling & Design:** TailwindCSS, PostCSS, class-variance-authority, clsx, tailwind-merge.
**Form Handling:** @hookform/resolvers, drizzle-zod.