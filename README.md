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
- ✅ **Fully responsive design that works seamlessly across all devices**

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
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern Animations**: Smooth transitions and hover effects
- **Alert System**: Contextual feedback for actions and errors
- **Mobile-First Approach**: Optimized for touch interactions and small screens

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
- `Navbar` / `Footer`: Navigation and branding with mobile menu
- `LearningPlanDisplay`: Expandable, structured plan viewer
- `QuizDisplay`: Interactive quiz with feedback and explanations
- `FaceAuth`: Face registration and login (uses face-api.js and browser camera)
- `ProfileEditModal` / `ChangePasswordModal`: Profile management
- `RichTextEditor`: Rich text note-taking
- `AlertProvider` / `Alert`: User feedback and notifications
- `CustomUserButton`: User menu and sign out

---

### 📱 7. Responsive Design Features

#### Mobile-First Approach
- **Breakpoints**: `sm:` (640px+), `md:` (768px+), `lg:` (1024px+), `xl:` (1280px+)
- **Flexible Layouts**: Grid and flexbox layouts that adapt to screen size
- **Touch-Friendly**: Optimized button sizes and spacing for mobile devices

#### Key Responsive Improvements
1. **Navigation**
   - Mobile hamburger menu with slide-down navigation
   - Responsive logo and button sizes
   - Touch-friendly mobile menu items

2. **Content Layout**
   - Responsive grid systems (1 column on mobile, 2-4 on larger screens)
   - Flexible card layouts that stack on mobile
   - Proper spacing and padding for all screen sizes

3. **Typography**
   - Responsive text sizes (`text-sm sm:text-base`, `text-xl sm:text-2xl`)
   - Readable font sizes on mobile devices
   - Proper line heights and spacing

4. **Forms and Inputs**
   - Touch-friendly input fields and buttons
   - Responsive form layouts (stacked on mobile, side-by-side on desktop)
   - Proper spacing between form elements

5. **Interactive Elements**
   - Responsive quiz cards and learning plan sections
   - Touch-friendly buttons and interactive elements
   - Proper spacing for mobile interactions

6. **Dashboard and Profile**
   - Responsive stats cards and data visualization
   - Mobile-optimized navigation tabs
   - Flexible content layouts

#### Responsive Utilities Added
- `.text-responsive-*`: Responsive text size utilities
- `.space-responsive`: Responsive spacing utilities
- `.p-responsive`, `.px-responsive`, `.py-responsive`: Responsive padding utilities

---

### 🚀 8. Getting Started

#### Prerequisites
- Node.js 20+ 
- npm or yarn
- PostgreSQL database (Neon recommended)
- Clerk account for authentication
- OpenRouter API key for AI features

#### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npx prisma migrate dev`
5. Start development server: `npm run dev`

#### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# AI Services
OPENROUTER_API_KEY="sk-..."

# Face Recognition (optional)
FACE_API_MODELS_PATH="/public/models"
```

---

### 🎨 9. Design System

#### Color Palette
- **Primary**: Yellow/Gold (`#fbbf24`) - Accent color for primary actions
- **Background**: Pure black (`#000000`) - Main background
- **Card**: Dark grey (`#1a1a1a`) - Card backgrounds
- **Text**: White (`#ffffff`) - Primary text
- **Muted**: Light grey (`#9ca3af`) - Secondary text

#### Typography
- **Headings**: Inter font family, responsive sizes
- **Body**: System font stack, optimized for readability
- **Code**: Monospace font for code blocks

#### Spacing
- **Mobile-first**: 4px base unit, responsive spacing
- **Consistent**: 8px, 16px, 24px, 32px spacing scale
- **Responsive**: Adapts to screen size

---

### 🔧 10. Development

#### Code Structure
```
personalized-ai/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── notes/            # Notes pages
│   ├── profile/          # Profile pages
│   └── auth/             # Authentication pages
├── components/           # Reusable UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── prisma/              # Database schema and migrations
└── public/              # Static assets
```

#### Key Technologies
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom responsive utilities
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Authentication**: Clerk
- **AI**: OpenRouter (DeepSeek)

---

### 📊 11. Performance

#### Optimization Features
- **Server-Side Rendering**: Fast initial page loads
- **Code Splitting**: Automatic code splitting by route
- **Image Optimization**: Next.js Image component
- **Caching**: SWR for data fetching and caching
- **Bundle Optimization**: Tree shaking and minification

#### Mobile Performance
- **Touch Optimization**: Responsive touch targets (44px minimum)
- **Loading States**: Skeleton screens and loading indicators
- **Offline Support**: Service worker for offline functionality
- **Progressive Enhancement**: Works without JavaScript

---

### 🤝 12. Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple devices and screen sizes
5. Submit a pull request

#### Development Guidelines
- Follow mobile-first responsive design principles
- Test on multiple devices and screen sizes
- Use semantic HTML and accessible markup
- Follow TypeScript best practices
- Write comprehensive tests

---

### 📄 13. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

### 🙏 14. Acknowledgments

- **Clerk**: Authentication and user management
- **Neon**: PostgreSQL database hosting
- **OpenRouter**: AI model access
- **Tailwind CSS**: Utility-first CSS framework
- **Next.js**: React framework
- **Prisma**: Database ORM

---

**Built with ❤️ for personalized learning** 
 