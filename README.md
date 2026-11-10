# MathVenture 🎮📐

MathVenture is an interactive, gamified math learning platform designed for young learners, built on modern web technologies. It bridges game-based education with classroom integration, offering separate dashboards and features for both **Students** and **Teachers**.

*   **Legacy Version (v1):** [mathventurev1.netlify.app](https://mathventurev1.netlify.app)
*   **Repository:** [GitHub Repository](https://github.com/Thalanas110/MathVenture)

---

## 🚀 Features

### 👦 Student Adventure
*   **Gamified Topics:** Quizzes and learning models covering:
    *   🔢 **Numbers** & Counting
    *   ➕ **Addition** & ➖ **Subtraction**
    *   ⚖️ **Comparison** (Greater than, Less than, Equal to)
    *   ⏰ **Clock** & Time reading
    *   🎨 **Colors** & 🔺 **Shapes**
    *   🔄 **Sequencing** & Pattern completion
    *   📏 **Measurement**
    *   🎮 **Free Play** mode for unrestricted exploration
*   **Interactive UI:** High-fidelity animations, responsive audio feedback, and celebration effects (confetti) upon module completion.
*   **Multilingual Support:** Localized and translated user interface options.

### 👩‍🏫 Teacher Control Panel
*   **Classroom Management:** View, edit, and organize multiple class sections.
*   **Student Monitoring:** Detailed statistics, progress tracking, and activity reports for each student.
*   **Assignments:** Assign specific topics or custom quizzes to groups of students.

### Offline classroom use

After one successful online teacher login and classroom-pack download, the installed PWA can continue working without internet. Class creation and renaming, assignments, roster changes, posts, quiz checkpoints, attempts, dashboards, authenticated Free Play progress, and cached student switching are saved in SQLite or IndexedDB locally and synchronized later with **Sync now**. The first online login starts a sliding seven-day lease; force-reloads do not extend it. Registration, initial login, teacher account changes, and class archive/unarchive still require internet; offline prompts say **check internet connection as this is online-only**. See [Offline classroom operation](docs/offline-classroom.md).

---

## 🛠️ Technology Stack

*   **Frontend Framework:** React 19 + TypeScript + Vite 6
*   **Styling:** Tailwind CSS v4 + Vanilla CSS
*   **UI Components:** Radix UI primitives, Lucide Icons, and Framer Motion (for fluid animations)
*   **Routing:** Wouter (lightweight React router)
*   **State Management & Data Fetching:** TanStack Query (React Query)
*   **Backend & Auth:** Supabase (Database, Auth, and Edge Functions)
*   **Offline application data:** SQLite WASM in OPFS for the PWA, with a native SQLite adapter boundary for the future Tauri desktop app
*   **Visualizations:** Recharts (for student dashboard statistics)

---

## 📁 Repository Structure

```text
mathventure/
├── frontend/            # React, Vite, assets, tests, and frontend tooling
│   ├── src/             # Application source and PWA code
│   ├── public/          # Browser-served assets and media
│   ├── test/            # Frontend tests
│   ├── scripts/         # Frontend build and asset scripts
│   └── package.json     # Frontend dependencies and commands
├── supabase/            # Backend migrations, functions, and configuration
├── test/supabase/       # Backend tests
└── docs/                # Project documentation and design records
```

---

## ⚙️ Getting Started

### 📋 Prerequisites
*   Node.js 22.23.4 (use the repository's `.nvmrc`)
*   npm or Deno

### 🔧 Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Thalanas110/MathVenture.git
   cd mathventure
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install --prefix frontend
   ```

3. **Configure Environment Variables:**
   Create `frontend/.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### App-data transport security

Application data is sent through Supabase Edge Functions over HTTPS/TLS. Hosted builds must use an `https://` Supabase URL; only loopback HTTP URLs are accepted for local development.

The frontend does not contain a transport encryption key and does not wrap app-data requests or responses in a second AES envelope. Do not add a `VITE_TRANSPORT_ENCRYPTION_KEY` or copy any Supabase Function Secret into frontend environment variables. Sensitive database fields requiring AES-256-GCM at rest must be handled inside Edge Functions as a separate, field-specific design.

4. **Run the frontend development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173` to view the application.

5. **Build the frontend for production:**
   ```bash
   npm run build
   ```

The root scripts delegate to the self-contained `frontend/` project. You can
also run frontend commands directly with `npm --prefix frontend run <script>`.

### Windows Tauri desktop build

The current desktop target is Windows only. Install the pinned Node.js version
from `.nvmrc`, Rust with the
MSVC toolchain, Microsoft C++ Build Tools, and WebView2. Then run from the
repository root:

```powershell
npm install
npm install --prefix frontend
npm run tauri:dev
```

Create a debug Windows bundle with:

```powershell
npm run tauri:build -- --debug
```

The Tauri app stores native classroom SQLite data in its Windows application
configuration directory as `mathventure-app.sqlite3`. It packages the Free
Play media library with the frontend, while the web build continues to use
the PWA service worker and browser media cache. Browser storage permission is
best effort: if SQLite/OPFS is durable but the browser declines
`navigator.storage.persist()`, the app reports browser-managed retention and
continues to protect local writes.

Backend commands run from the repository root and use the root-level `supabase/` directory:

```bash
supabase start
supabase status
supabase functions serve
supabase db reset
```

### Teacher password recovery email

Teacher signup intentionally signs in immediately. Only the forgot-password
flow sends email: Supabase Auth generates a six-digit recovery code, and the
configured SMTP provider delivers it.

For the hosted Supabase project:

1. Create a Gmail app password for the sending account. Do not use the normal
   Gmail account password.
2. In Supabase Authentication settings, enable external email delivery and
   configure Gmail SMTP with `smtp.gmail.com`, port `465` using SSL or port
   `587` using STARTTLS, the sender address, the Gmail app password, and a
   sender name.
3. Keep email confirmations disabled so teacher signup remains immediate.
4. Set Email OTP expiration to `300` seconds and OTP length to `6`.
5. Set the hosted Reset Password email template to include `{{ .Token }}`.
6. Add the deployed application's `/reset-password` URL to the Supabase
   Auth redirect URL allow list.
7. Keep SMTP credentials only in Supabase-managed settings and disable link
   tracking if it is enabled for the Gmail sending account.

For local development, the settings in `supabase/config.toml` configure a
six-digit code with a five-minute lifetime and immediate signup. Supabase's
local Mailpit captures Auth emails; run `supabase status` from the repository
root to find its URL. Gmail credentials are not needed for local tests.

---

## 🔬 Academic Research & Background

MathVenture is backed by active educational research investigating gamified learning efficacy. 
*   **Thesis Manuscript:** You can find the research paper ["Counting the Uncounted"](frontend/public/assets/papers/FIN-GROUP1-RESEARCH-MANUSCRIPT.pdf) in the frontend public assets directory.
*   **Research Team:** Developed and designed by DMM (Main Researcher), MR, GY, ALR, and GV.
