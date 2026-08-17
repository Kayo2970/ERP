# LEADS Next Gen All-in-One Dashboard

This repository contains the private internal operations and management dashboard for the **LEADS Next Gen Centre at MSRUAS, Bengaluru**. It consolidates task traceability, event management, performance evaluation, reimbursement claims, and public feedback collection into a single, cohesive portal.

---

## 📂 Project Structure

- **`leads-dashboard/`**: The Next.js 14 (App Router) + TypeScript + Tailwind CSS (v4) project containing the active implementation of the dashboard.
- **`PROJECT DOCS/`**: Curated product specifications, sitemaps, database models, technical specifications, and copywriting guidelines.
- **`Arclon_v1.0/`**: Gulp-based reference Bootstrap 5 admin template, serving as the visual reference for the dashboard.
- **`Arclon-Sketch_v1.0.sketch`**: Reference UI design Sketch source file.

---

## 🚀 Getting Started

### 1. Running the LEADS Next Gen Dashboard (Active Implementation)

The dashboard is built using **Next.js 14 (App Router)** and **Tailwind CSS v4** featuring a modern, premium space-themed glassmorphic UI.

```bash
# Navigate to the project directory
cd leads-dashboard

# Install dependencies
npm install

# Run the development server
npm run dev -- -p 3030
```

Open [http://localhost:3030](http://localhost:3030) in your browser to view the login screen.
- **Mock Login Credentials (For Testing & Review)**:
  - **Email**: `kayomarz@msruas.ac.in` (Accepts any email address containing `@`)
  - **Password**: `password123` (Accepts any password value)
- **Theme Switcher**: Supported seamlessly (Sun/Moon icon in the navbar) to toggle light and dark glassmorphic themes.

---

## 🛠️ Tech Stack & Key Integrations

- **Frontend**: Next.js 14 (App Router) & TypeScript
- **Styling**: Tailwind CSS v4 & custom glassmorphism utilities (`globals.css`)
- **State & Theme**: Client-side theme context with localStorage persistence
- **Icons**: Lucide React
- **Charts**: Recharts (fully responsive custom graphs)
- **Database (Target)**: PostgreSQL via Supabase with database-level Row-Level Security (RLS)

---

## 📄 Documentation Index

For detailed requirements and specs, see the `PROJECT DOCS/files/` directory:
1. [Product Requirements Document (PRD)](PROJECT%20DOCS/files/01-PRD-LEADSDashboard.md)
2. [Sitemap & Route Matrix](PROJECT%20DOCS/files/02-Sitemap-LEADSDashboard.md)
3. [Design System Specification](PROJECT%20DOCS/files/03-DesignSystem-LEADSDashboard.md)
4. [Technical Specification](PROJECT%20DOCS/files/04-TechSpec-LEADSDashboard.md)
5. [Entity-Relationship Diagram & Database Schemas](PROJECT%20DOCS/files/05-DataModel-ERD-LEADSDashboard.md)
6. [Copywriting & Email Alert Templates](PROJECT%20DOCS/files/06-Content-Copy-LEADSDashboard.md)
7. [Reports & Analytics Specs](PROJECT%20DOCS/files/07-ReportsAnalytics-LEADSDashboard.md)
