Of course. Here are the revised PRD, Architecture, UI/UX, and Execution Plan documents, all tailored to build the loopwho project efficiently on top of the MkSaaS boilerplate.

---

## **📄 1\. Revised Product Requirements Document (PRD)**

This PRD adapts the original loopwho vision to a concrete MVP, leveraging the components and infrastructure provided by the MkSaaS boilerplate.

### **Goal**

Build a **privacy dashboard MVP** by adapting the MkSaaS boilerplate. The app will automatically fetch and interpret a user’s privacy settings from major platforms using a custom browser extension, presenting these settings in plain English and tracking changes over time.

### **Core Features (Boilerplate-Aware)**

1. **User Onboarding & Management**  
   * **Requirement:** Create account (OAuth or email/password) and manage profile.  
   * **Boilerplate Solution:** Utilize the boilerplate's pre-built **Better Auth module** for multi-provider login (Google, GitHub, email), email verification, and password recovery. Adapt the existing user settings pages for profile management.  
   * **Custom Work:** Add a step in the onboarding flow to prompt for the browser extension installation.  
2. **Automated Privacy Settings Scan**  
   * **Requirement:** An extension that scrapes privacy settings from connected services.  
   * **Boilerplate Solution:** None. This is **100% custom development**.  
   * **Custom Work:** Develop a Manifest v3 browser extension with content scripts for DOM scraping, a background worker for scheduling, and a messaging bridge to the web app's backend. Implement fallback mechanisms (Firecrawl/OCR) as specified in the original PRD.  
3. **Dashboard & Data Visualization**  
   * **Requirement:** Display normalized settings, plain-English explanations, and change history.  
   * **Boilerplate Solution:** Adapt the boilerplate's existing responsive dashboard layout. Use its rich library of **shadCN UI components** (Cards, Accordions, Tables) to build the data display.  
   * **Custom Work:** Design and build the specific components for displaying privacy settings, service connection statuses, and historical diffs.  
4. **Backend Data Storage**  
   * **Requirement:** Store user data, service info, and versioned snapshots of privacy settings.  
   * **Boilerplate Solution:** Leverage the boilerplate’s **Drizzle ORM setup** and migration system with our Supabase PostgreSQL database. The boilerplate's S3-compatible storage module will be used for raw snapshots on Cloudflare R2.  
   * **Custom Work:** Define and implement the loopwho-specific data schema (services, snapshots, diffs) and configure the snapshots table as a TimescaleDB hypertable.  
5. **Analysis & Insights**  
   * **Requirement:** Use the Gemini API to generate user-friendly interpretations of scraped settings.  
   * **Boilerplate Solution:** Adapt the existing architectural patterns for making secure, server-side API calls to AI providers.  
   * **Custom Work:** Implement a specific client for the **Gemini API** and the backend logic to process raw snapshot data through it.

### **Decommissioned Boilerplate Features**

To maintain MVP focus and reduce complexity, the following boilerplate features will be **removed**:

* **Stripe Payment & Subscription System**  
* **Credit System** (purchasing and consumption)  
* **Content Management** (Blog and Docs)  
* **Newsletter System**  
* **Multi-language Support (i18n)** will be disabled for the MVP to simplify the UI, but can be re-enabled later.

---

## **🏛️ 2\. Revised System Architecture**

This architecture integrates the custom-built loopwho components with the foundational services provided by the MkSaaS boilerplate.

[Image of System Architecture Diagram](https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcTa0g-eoF84cYJbK0zNfDinOp97LH5OH4XdeAUroQEmdEuvcialTH7e8I1ViHf8DX3vfEmpIWsAS9wHNHQokCfhcSdM3fidSrV9R2qw07op-Jcgg6I)

Code snippet

flowchart TD  
    subgraph loopwho Custom Components  
        direction LR  
        BrowserExt\["Browser Extension (Manifest v3)"\]  
        ScrapingEngine\["Scraping & Diffing Engine"\]  
        GeminiClient\["Gemini API Client"\]  
    end

    subgraph Boilerplate Foundation (Adapted MkSaaS)  
        WebApp\["Web App (Next.js, shadCN UI)"\]  
        BackendAPI\["Backend API (Server Actions)"\]  
        Auth\["User Auth (Better Auth)"\]  
        DB\["Data Layer (Drizzle ORM)"\]  
        BlobStorage\["Blob Storage (S3 Client)"\]  
    end  
      
    subgraph External Infrastructure  
        Supabase\["Supabase (Postgres \+ TimescaleDB)"\]  
        R2\["Cloudflare R2"\]  
        GeminiAPI\["Google Gemini API"\]  
    end

    %% Connections  
    User \--\> WebApp  
    User \--\> BrowserExt

    WebApp \<--\> Auth  
    WebApp \<--\> BackendAPI  
      
    BrowserExt \-- Scraped JSON \--\> BackendAPI  
    BackendAPI \-- Uses \--\> ScrapingEngine  
    BackendAPI \-- Stores Data via \--\> DB  
    BackendAPI \-- Stores Blobs via \--\> BlobStorage  
    BackendAPI \-- Analyzes via \--\> GeminiClient  
      
    ScrapingEngine \-- Generates Diffs \--\> DB  
    GeminiClient \-- Calls \--\> GeminiAPI  
      
    DB \-- Connects to \--\> Supabase  
    BlobStorage \-- Connects to \--\> R2

    %% Decommissioned  
    subgraph Decommissioned Boilerplate Modules  
        Stripe\["Stripe Payments"\]  
        Credits\["Credit System"\]  
        Blog\["Blog/Docs"\]  
    end

    style Decommissioned Boilerplate Modules fill:\#fdd,stroke:\#f00,stroke-width:2px,stroke-dasharray: 5 5

### **Architectural Breakdown**

1. **Frontend (WebApp):**  
   * **Source:** Boilerplate.  
   * **Technology:** Next.js App Router, TailwindCSS, shadCN UI.  
   * **Function:** Serves the user-facing dashboard, settings, and onboarding pages. We will build our custom UI components using the boilerplate's established system.  
2. **Backend (BackendAPI):**  
   * **Source:** Boilerplate.  
   * **Technology:** Next.js Server Actions with next-safe-action for validation.  
   * **Function:** Provides the core API for the web app and browser extension. We will extend it with new actions for submitting, retrieving, and analyzing privacy snapshots.  
3. **Authentication (Auth):**  
   * **Source:** Boilerplate.  
   * **Technology:** Better Auth.  
   * **Function:** Handles all user sign-up, login, and session management. It's deeply integrated and will be used as-is to accelerate development.  
4. **Data Layer (DB & BlobStorage):**  
   * **Source:** Boilerplate.  
   * **Technology:** Drizzle ORM for PostgreSQL and an S3-compatible client for blob storage.  
   * **Function:** We will use the boilerplate's Drizzle Kit for migrations (pnpm db:generate, pnpm db:migrate) to build our custom schema on Supabase. The S3 client will connect directly to our Cloudflare R2 bucket.  
5. **Browser Extension & Scraping Engine (Custom):**  
   * **Source:** loopwho (Custom Build).  
   * **Function:** This is the heart of loopwho. The extension performs the authenticated scraping and sends data to the BackendAPI. The ScrapingEngine on the backend is responsible for processing this data, creating versioned snapshots, and running diffs.

---

## **✨ 3\. UI/UX Plan**

This plan outlines how to adapt the boilerplate's extensive component library to create the loopwho user experience, ensuring a consistent and professional look from day one.

### **User Flow to Component Mapping**

1. **Onboarding & Sign-Up**  
   * **User Action:** Creates an account or logs in.  
   * **Boilerplate UI:** Use the authentication card and forms from /src/components/auth/. The existing Google and GitHub social login buttons will be used directly.  
   * **Customization:** Add a post-login modal (\<Dialog\>) prompting the user to install the browser extension.  
2. **Initial Dashboard (Empty State)**  
   * **User Action:** Lands on the dashboard for the first time.  
   * **Boilerplate UI:** Use the main dashboard layout (/src/app/\[locale\]/(dashboard)/layout.tsx). We will use the \<Card\> component with a call-to-action section, guiding users to connect their first service (e.g., "Connect Google").  
   * **Customization:** Remove the boilerplate's default analytics and welcome widgets.  
3. **Dashboard (Populated State)**  
   * **User Action:** Views their fetched privacy settings.  
   * **Boilerplate UI:** Each connected service will be a \<Card\> component. Inside the card, we'll use an \<Accordion\> for the different categories of privacy settings. Each setting will be a row with a \<Switch\> or similar indicator for its state, a plain-English summary, and a link.  
   * **Customization:** This is the primary area of custom UI development, but it will be built entirely from the boilerplate's primitives (Card, Accordion, Button, Badge, etc.).  
4. **Settings Page**  
   * **User Action:** Manages their profile or connected services.  
   * **Boilerplate UI:** Adapt the existing multi-tabbed settings page located at /src/app/\[locale\]/(dashboard)/settings/.  
   * **Customization:**  
     * Keep the **Profile** and **Security** tabs as-is.  
     * Remove the **Billing** and **Credits** tabs.  
     * Add a new **Connected Services** tab to list platforms like Google and Facebook, allowing users to trigger re-scans or disconnect them.

---

## **🗺️ 4\. Execution Plan**

This is a phased plan to build the loopwho MVP, following the "trim and extend" strategy.

### **Phase 0: Foundation & Pruning (1 Week)**

* **Goal:** Prepare the boilerplate for loopwho development.  
* **Tasks:**  
  1. **Setup Project:** Fork the repo, pnpm install, and connect to development Supabase and R2 instances.  
  2. **Run Boilerplate:** Start the dev server (pnpm dev) and ensure the base boilerplate runs correctly.  
  3. **Aggressive Pruning:** Create a new branch and delete all directories, components, and API routes related to non-MVP features:  
     * Payments (/src/payment/, stripe actions)  
     * Credits (/src/credits/, credit actions)  
     * Blog & Docs (/content/blog, /content/docs)  
     * Newsletter (/src/newsletter/)  
  4. **Schema Reset:** Update src/db/schema.ts to remove decommissioned tables and run pnpm db:generate to create a clean migration.  
  5. **UI Cleanup:** Remove links to pruned features from the navbar, sidebar, and footer configs (/src/config/).

### **Phase 1: Core Backend & Data Model (1 Week)**

* **Goal:** Build the data storage foundation for loopwho.  
* **Tasks:**  
  1. **Implement Schema:** Code the users, services, snapshots, and diffs tables in src/db/schema.ts.  
  2. **Migrate Database:** Run pnpm db:migrate to push the new schema to Supabase.  
  3. **Configure TimescaleDB:** Enable the extension in Supabase and configure the snapshots table as a hypertable.  
  4. **Create API Endpoint:** Build the first server action (submitSnapshot) that accepts a JSON payload and user session, creating a new record in the snapshots table.

### **Phase 2: Browser Extension & Scraping PoC (2 Weeks)**

* **Goal:** Build the core scraping functionality and connect it to the backend.  
* **Tasks:**  
  1. **Scaffold Extension:** Set up the basic Manifest v3 extension structure.  
  2. **Develop Scraper V1:** Write a content script to scrape a single, stable target page (e.g., Google Ad Settings).  
  3. **Implement Auth Bridge:** Use the extension APIs to get the user's session cookie from the web app's domain.  
  4. **End-to-End Test:** Successfully send a scraped JSON object from the extension, through the authenticated submitSnapshot action, and see it appear in the Supabase database.

### **Phase 3: Dashboard UI & Gemini Integration (2 Weeks)**

* **Goal:** Visualize the data and enrich it with AI-powered insights.  
* **Tasks:**  
  1. **Create Data Endpoints:** Build server actions to fetch the latest snapshot and historical diffs for a given user and service.  
  2. **Develop Dashboard UI:** Build the custom UI components for the dashboard using shadCN primitives as planned in the UI/UX document.  
  3. **Implement Gemini Client:** Write the service logic to send snapshot content to the Gemini API.  
  4. **Integrate Insights:** Store Gemini summaries alongside snapshots and display them in the dashboard UI.  
  5. **Build History View:** Create a modal or page to display the diffs between snapshots over time.