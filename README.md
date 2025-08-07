## 📚 Personalized Study Assistant (StudyMate)

### 📌 1. Project Overview
StudyMate is a modern web application that empowers users to learn efficiently by generating custom learning plans, interactive quizzes, and dynamic concept explanations tailored to their needs. The app leverages AI-powered content generation, face authentication, and a beautiful, responsive UI to deliver a truly personalized and engaging learning experience.

---

### 🎯 2. Objectives
- ✅ Provide a personalized learning journey for users
- ✅ Automate the generation of study plans, quizzes, and explanations
- ✅ Enable progress tracking and history
- ✅ Ensure secure authentication (including face login) and user management
- ✅ Support rich note-taking with version history

---

### 🏗 3. Tech Stack
| Technology           | Purpose                                                      |
|----------------------|--------------------------------------------------------------|
| Next.js 15           | Frontend + backend (server actions, API routes, UI)          |
| Tailwind CSS         | Modern UI styling with utility-first approach                |
| Heroicons/Lucide     | Beautiful, consistent icons                                  |
| Clerk                | Authentication (email/password + face login)                 |
| Neon (PostgreSQL)    | Database for user data, plans, quizzes, notes                |
| Prisma ORM           | Type-safe database access                                    |
| DeepSeek (OpenRouter)| AI-powered generation of plans, quizzes, explanations        |
| face-api.js          | Face recognition/authentication in browser                   |
| SWR                  | Data fetching and caching                                    |
| PDFKit               | Exporting content as PDF                                     |

---

### 🔥 4. Core Features
#### User Features
- **Sign Up / Sign In**: Secure authentication with Clerk (email/password or face login)
- **Face Authentication**: Register and sign in using your face (powered by face-api.js)
- **Topic Input**: Enter topics you want to learn
- **AI-Generated Learning Plan**: DeepSeek generates a structured, actionable plan
- **Interactive Quizzes**: Personalized questions with instant feedback and explanations
- **Concept Explanations**: Dynamic, AI-powered explanations for quiz answers
- **Progress Tracking**: Dashboard shows your learning history, quiz scores, and recommendations
- **Rich Notes**: Create, edit, tag, pin, and version your study notes (with rich text editor)

#### UI/UX Features
- **Card-Based Layout**: Learning plans and quizzes in beautiful, expandable cards
- **Accordion Sections**: Collapsible content for better organization
- **Visual Feedback**: Color-coded sections, icons, and progress indicators
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Modern Animations**: Smooth transitions and hover effects
- **Alert System**: Contextual feedback for actions and errors

#### Admin/Backend Features
- **Secure Data Storage**: All user data stored in Neon (PostgreSQL) via Prisma
- **API Endpoints**: RESTful endpoints for plans, quizzes, notes, face auth, and more
- **User Data Sync**: Sync between Clerk and database
- **Note Versioning**: Restore previous versions of notes

---

### 🖥 5. User Flow
1. **Sign Up / Sign In** (via Clerk, with optional face registration)
2. **Enter Topic** → System sends request to DeepSeek
3. **AI Returns Plan & Quiz** → Displayed in card UI
4. **User Interacts**: Take quiz, get explanations, save notes
5. **Dashboard**: Track progress, review history, manage notes
6. **Profile**: Edit profile, change password, update face data

---

### 🧩 6. Key UI Components
- `Navbar` / `Footer`: Navigation and branding
- `LearningPlanDisplay`: Expandable, structured plan viewer
- `QuizDisplay`: Interactive quiz with feedback and explanations
- `FaceAuth`: Face registration and login (uses face-api.js and browser camera)
- `ProfileEditModal` / `ChangePasswordModal`: Profile management
- `RichTextEditor`: Rich text note-taking
- `AlertProvider` / `Alert`: User feedback and notifications
- `CustomUserButton`: User menu and sign out

---

### 🔗 7. API Endpoints (Highlights)
- `/api/generate-plan` (POST): Generate AI-powered learning plan for a topic
- `/api/generate-quiz` (POST): Generate quiz questions for a topic
- `/api/explain-answer` (POST): Get AI explanation for quiz answers
- `/api/notes` (GET/POST): Fetch or create notes
- `/api/notes/[id]` (GET/PATCH/DELETE): Get, update, or delete a note
- `/api/notes/[id]/versions` (GET): List all versions of a note
- `/api/notes/versions/[id]/restore` (POST): Restore a note to a previous version
- `/api/auth/face-register` (POST): Register user with face embedding
- `/api/face-login` (POST): Authenticate user via face embedding
- `/api/auth/change-password` (PUT): Change user password
- `/api/auth/upload-profile-image` (POST): Upload profile image
- `/api/auth/update-user-profile` (PUT): Update user profile info

---

### 🗄 8. Database Schema (Prisma)
- **User**: id, email, password, firstName, lastName, clerkId, createdAt
- **FaceEmbedding**: id, userId, embedding (JSON), createdAt
- **LearningPlan**: id, topic, content, userId, createdAt
- **QuizResult**: id, topic, questions (JSON), answers (JSON), score, userId, createdAt
- **Note**: id, title, content, tags, isPinned, isStarred, userId, createdAt, updatedAt
- **NoteVersion**: id, noteId, title, content, tags, createdAt

---

### 🚀 9. Getting Started
1. **Clone the repo**
2. **Install dependencies**: `npm install`
3. **Set up environment variables** (see `.env.example`)
4. **Run database migrations**: `npx prisma migrate deploy`
5. **Start the dev server**: `npm run dev`

---

### ✅ 10. Conclusion
StudyMate combines AI, face authentication, and modern web tech to deliver a truly personalized, interactive, and secure learning platform. Whether you're a student, professional, or lifelong learner, StudyMate adapts to your needs and helps you achieve your learning goals.

---

### 👨‍💻 Developer

- **Name:** Muhammad Ahtasham
- [LinkedIn](https://www.linkedin.com/in/muhammadahtasham/)
- [GitHub](https://github.com/Muhammad-Ahtasham)
- [Portfolio Website](https://atiiisham.vercel.app) 
 