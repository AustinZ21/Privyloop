# 📄 Privacy Dashboard MVP – PRD & Architecture

## 1. Goal
Build a **privacy dashboard web app** that automatically fetches and interprets a user’s privacy settings across major platforms (Google, Microsoft, Facebook, etc.) without storing credentials or requiring manual navigation. The app will present these settings in plain English and track changes over time.

---

## 2. Core Features

### MVP must-have
1. **User onboarding**  
   - Install browser extension + create account (OAuth or email/password).  
   - Add services (Google, Microsoft, etc.) to dashboard.  

2. **Automated privacy settings scan**  
   - Extension opens settings pages in background tabs.  
   - Scrape DOM to extract toggle states.  
   - Handle cases where DOM is dynamic → fallback: Firecrawl + OCR if page content structure changes.  

3. **Dashboard view**  
   - Show normalized settings for each connected service.  
   - Plain English explanation of what each setting means.  
   - Link to official page for quick remediation.  

4. **Change tracking**  
   - Detect differences between scans.  
   - Store versions of parsed privacy pages.  

5. **Analysis & insights**  
   - Use **Gemini API** to analyze raw extracted content → summarize into user-friendly interpretation.  

### Future (not MVP but keep in mind)
- Notifications when privacy settings change.  
- Support for additional platforms (web only)  
- Comparison reports (e.g., “Facebook is more aggressive than Google in tracking your activity”)  
- AI-assisted recommendations (“Turn this off if you don’t want X”)  

---

## 3. User Flow (MVP)

1. User signs up → installs extension.  
2. On dashboard → clicks “Connect Google” / “Connect Microsoft / other services.”  
3. Extension background process:  
   - Open target privacy pages.  
   - Scrape DOM (with Firecrawl + OCR fallback).  
   - Return JSON of settings.  
4. Backend receives JSON → stores in DB (with timestamp + versioning).  
5. Gemini processes JSON/text → plain-English explanations.  
6. Dashboard renders results.  
7. User can click “See history” → view previous versions.  

---

## 4. Tech Stack

### Frontend
- **Next.js (App Router)** deployed on **Vercel**  
- **shadCN + TailwindCSS** for UI  
- **NextAuth.js** for authentication  

### Browser Extension
- **Manifest v3**  
- Content scripts for DOM scraping  
- Background service worker for scheduling scans  
- Messaging bridge to send results to backend  

### Backend
- **Render** (or Vercel Serverless)  
- **Supabase (PostgreSQL)** for structured data  
- **TimescaleDB** for time-series snapshots  
- **Cloudflare R2** for raw privacy page snapshots  

### AI / Analysis
- **Gemini API**: Summaries & plain-English explanations  
- **Firecrawl API**: Crawl alternative page structures  
- **OCR (Tesseract.js / Cloud API)**: Extract text from images  
- **AI recommendation engine**: Suggests user actions  

---

## 5. Data Model (MVP)

**Tables**:  
- `users`  
- `services`  
- `snapshots`  
- `diffs`  
- `notifications`  
- `recommendations`  
- `comparisons`  
- `blob_storage`  

---

## 6. Edge Cases
- Dynamic UIs → Firecrawl + OCR  
- User not logged in → prompt login  
- Rate limits → stagger scans  
- Database scalability → TimescaleDB & JSONB for flexible storage  

---

## 7. System Architecture Diagram

```mermaid
flowchart TD

  subgraph User["User Environment"]
    BrowserExt["Browser Extension"]
    WebApp["Web App (Next.js, Tailwind, shadCN)"]
  end

  subgraph Backend["Backend Services"]
    API["API Gateway / Serverless Functions"]
    DB["PostgreSQL / TimescaleDB (Supabase)"]
    Blob["Cloudflare R2 (Blob Storage)"]
    Notif["Notification Service"]
  end

  subgraph AI["AI & Processing"]
    Gemini["Gemini API (Summaries & Recommendations)"]
    Firecrawl["Firecrawl API"]
    OCR["OCR Engine"]
    Diff["Diff Engine (privacy change tracker)"]
  end

  BrowserExt -- JSON snapshots --> API
  API -- store parsed & raw --> DB
  API -- store raw blobs --> Blob
  DB -- triggers changes --> Diff
  Diff -- change detected --> Notif
  DB --> Gemini
  Gemini --> WebApp
  Firecrawl --> BrowserExt
  OCR --> BrowserExt
  WebApp <-- Notifications --> Notif

sequenceDiagram
    participant U as User
    participant FE as Frontend (Next.js + Tailwind/ShadCN)
    participant BE as Backend API (Render)
    participant DB as Supabase/Postgres
    participant R2 as Cloudflare R2
    participant AI as Gemini Analysis

    U->>FE: Logs in, selects platforms to track
    FE->>BE: Request to add new service
    BE->>R2: Fetch/Store latest privacy snapshot (via Firecrawl/OCR if needed)
    BE->>DB: Save snapshot metadata & content link
    BE->>AI: Send snapshot for analysis
    AI->>BE: Return simplified explanation & recommendations
    BE->>DB: Store analysis results
    BE->>FE: Return dashboard view with plain-English results

    Note over BE,DB: On schedule (CRON/Jobs)
    BE->>R2: Fetch new snapshot
    BE->>DB: Compare with previous snapshot (diff)
    DB->>BE: Diff result
    BE->>U: Notify user (email/push/notification)

8. Sequence Diagram (Snapshot → Dashboard Flow)
sequenceDiagram
    participant U as User
    participant FE as Frontend (Next.js + Tailwind/ShadCN)
    participant BE as Backend API (Render)
    participant DB as Supabase/Postgres
    participant R2 as Cloudflare R2
    participant AI as Gemini Analysis

    U->>FE: Logs in, selects platforms to track
    FE->>BE: Request to add new service
    BE->>R2: Fetch/Store latest privacy snapshot (via Firecrawl/OCR if needed)
    BE->>DB: Save snapshot metadata & content link
    BE->>AI: Send snapshot for analysis
    AI->>BE: Return simplified explanation & recommendations
    BE->>DB: Store analysis results
    BE->>FE: Return dashboard view with plain-English results

    Note over BE,DB: On schedule (CRON/Jobs)
    BE->>R2: Fetch new snapshot
    BE->>DB: Compare with previous snapshot (diff)
    DB->>BE: Diff result
    BE->>U: Notify user (email/push/notification)

9. Database ERD (Mermaid)
erDiagram
    USERS ||--o{ SNAPSHOTS : has
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ RECOMMENDATIONS : gets
    USERS ||--o{ COMPARISONS : requests

    SERVICES ||--o{ SNAPSHOTS : provides
    SERVICES ||--o{ COMPARISONS : involved_in

    SNAPSHOTS ||--o{ DIFFS : generates
    SNAPSHOTS ||--o{ BLOB_STORAGE : stores

    DIFFS ||--o{ NOTIFICATIONS : triggers
    DIFFS ||--o{ RECOMMENDATIONS : informs

    USERS {
        uuid id PK
        string email
        string auth_provider
        timestamp created_at
    }

    SERVICES {
        uuid id PK
        string name
        string category
        string privacy_url
        timestamp created_at
    }

    SNAPSHOTS {
        uuid id PK
        uuid user_id FK
        uuid service_id FK
        string version_hash
        text raw_content
        string blob_path
        timestamp created_at
    }

    DIFFS {
        uuid id PK
        uuid snapshot_id FK
        text diff_summary
        text raw_diff
        timestamp created_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        uuid diff_id FK
        string channel
        string message
        boolean seen
        timestamp created_at
    }

    RECOMMENDATIONS {
        uuid id PK
        uuid user_id FK
        uuid diff_id FK
        text advice
        string severity
        timestamp created_at
    }

    COMPARISONS {
        uuid id PK
        uuid user_id FK
        uuid service_a FK
        uuid service_b FK
        text comparison_summary
        timestamp created_at
    }

    BLOB_STORAGE {
        string blob_path PK
        string storage_provider
        string metadata
    }

