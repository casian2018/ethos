# Ethos - Fitness Social App Design System

## 1. Design System

### Color Palette

```css
/* Primary Colors */
--color-primary: #10B981;        /* Emerald 500 - Main accent */
--color-primary-hover: #059669;   /* Emerald 600 */
--color-primary-light: #D1FAE5;    /* Emerald 100 */

/* Neutral Colors */
--color-background: #FAFAFA;      /* Very light gray */
--color-surface: #FFFFFF;         /* Pure white cards */
--color-border: #E5E7EB;          /* Zinc 200 */
--color-border-hover: #D1D5DB;   /* Zinc 300 */

/* Text Colors */
--color-text-primary: #18181B;    /* Zinc 900 */
--color-text-secondary: #52525B; /* Zinc 600 */
--color-text-muted: #A1A1AA;     /* Zinc 400 */
--color-text-inverse: #FFFFFF;   /* White text */

/* Semantic Colors */
--color-success: #10B981;        /* Emerald */
--color-warning: #F59E0B;         /* Amber */
--color-error: #EF4444;          /* Red */
--color-info: #3B82F6;           /* Blue */

/* Fitness Level Colors */
--color-beginner: #3B82F6;       /* Blue */
--color-intermediate: #F59E0B;    /* Amber */
--color-advanced: #EF4444;        /* Red */
```

### Typography

```css
/* Font Family */
--font-sans: 'Inter', system-ui, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### Spacing System

```css
/* Based on 4px grid */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */

/* Border Radius */
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05);
--shadow-elevated: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

---

## 2. Navigation Structure

### Desktop Navigation (Top)

```
┌─────────────────────────────────────────────────────┐
│  Logo   │  Dashboard  │  Forum  │  Find Buddy  │  Profile  │
└─────────────────────────────────────────────────────┘
```

**Structure:**
- Fixed top navigation bar (height: 64px)
- Logo on left
- Navigation links centered
- User avatar + dropdown on right

### Mobile Navigation (Bottom)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                   [Page Content]                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│  🏠    📋    👥    ⚙️                              │
│Home  Forum Buddy  Profile                          │
└─────────────────────────────────────────────────────┘
```

**Structure:**
- Fixed bottom navigation (height: 64px)
- 4 primary actions
- Active state with primary color
- Icons with labels

### Page Hierarchy

```
/
├── /auth                    (Login/Register)
├── /profile
│   ├── /profile/setup      (New user onboarding)
│   └── /profile             (View/Edit profile)
├── /main                   (Dashboard)
├── /forum
│   ├── /forum              (Posts list)
│   └── /forum/[postId]     (Thread view)
├── /find_a_buddy          (Buddy matching)
├── /workout               (AI Workout generator)
└── /how_to               (Equipment guide)
```

---

## 3. Component Library

### Navbar Component

```tsx
// Location: components/Navbar.tsx
// Props: { user?: User, activeRoute?: string }

<nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 z-50">
  <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
    {/* Logo */}
    <Link href="/main" className="flex items-center gap-2">
      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold">E</span>
      </div>
      <span className="font-bold text-xl text-zinc-900">Ethos</span>
    </Link>
    
    {/* Desktop Nav Links */}
    <div className="hidden md:flex items-center gap-6">
      <NavLink href="/main" active={active === 'dashboard'}>Dashboard</NavLink>
      <NavLink href="/forum" active={active === 'forum'}>Forum</NavLink>
      <NavLink href="/find_a_buddy" active={active === 'buddy'}>Find Buddy</NavLink>
    </div>
    
    {/* User Menu */}
    <UserMenu user={user} />
  </div>
</nav>
```

### Card Component

```tsx
// Base Card - used throughout the app

<div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 hover:shadow-md transition-shadow">
  {/* Content */}
</div>

// Variants:
// - Default: white bg, subtle shadow
// - Elevated: larger shadow for featured content
// - Interactive: hover states for clickable cards
```

### Button Styles

```tsx
// Primary Button
<button className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium 
                  hover:bg-emerald-700 transition-colors disabled:opacity-50">
  Button Text
</button>

// Secondary Button
<button className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg font-medium 
                  hover:bg-zinc-200 transition-colors">
  Button Text
</button>

// Ghost Button
<button className="px-4 py-2 text-zinc-600 rounded-lg font-medium 
                  hover:bg-zinc-100 transition-colors">
  Button Text
</button>

// Icon Button
<button className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
  <Icon />
</button>
```

### Form Input Styles

```tsx
// Text Input
<input type="text" 
  className="w-full px-4 py-3 rounded-xl border border-zinc-200 
             focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 
             outline-none transition-all" />

// Textarea
<textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 
                    focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 
                    outline-none transition-all resize-none" />

// Checkbox
<input type="checkbox" 
  className="w-5 h-5 rounded border-zinc-300 text-emerald-600 
             focus:ring-emerald-500" />
```

### Tag/Badge Component

```tsx
// Fitness Level Tags
<span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
  Beginner
</span>

<span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
  Intermediate
</span>

<span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
  Advanced
</span>

// Goal Tags
<span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm">
  {goal}
</span>
```

### UserCard Component

```tsx
<div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-100">
  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
    {initials}
  </div>
  <div className="flex-1">
    <h4 className="font-medium text-zinc-900">{name}</h4>
    <p className="text-sm text-zinc-500">{city} · {fitnessLevel}</p>
  </div>
  <Button variant="primary">Connect</Button>
</div>
```

### PostCard Component

```tsx
<div className="bg-white rounded-2xl p-6 border border-zinc-100 hover:shadow-md transition-shadow">
  <div className="flex items-start gap-4">
    {/* Vote Column */}
    <div className="flex flex-col items-center gap-1">
      <Button variant="ghost" size="sm">▲</Button>
      <span className="text-sm font-medium text-zinc-600">0</span>
      <Button variant="ghost" size="sm">▼</Button>
    </div>
    
    {/* Content */}
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-zinc-900 hover:text-emerald-600 cursor-pointer">
        {title}
      </h3>
      <p className="text-zinc-600 mt-2 line-clamp-3">{excerpt}</p>
      
      {/* Meta */}
      <div className="flex items-center gap-4 mt-4 text-sm text-zinc-500">
        <span>@{author}</span>
        <span>{timeAgo}</span>
        <span>{comments} comments</span>
      </div>
    </div>
  </div>
</div>
```

### WorkoutCard Component

```tsx
<div className="bg-white rounded-2xl p-6 border border-zinc-100">
  <h3 className="font-semibold text-zinc-900 mb-4">{day}</h3>
  <ul className="space-y-3">
    {exercises.map((exercise, i) => (
      <li key={i} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
        <span className="text-zinc-700">{exercise.name}</span>
        <span className="text-zinc-500 text-sm">{exercise.sets} × {exercise.reps}</span>
      </li>
    ))}
  </ul>
</div>
```

---

## 4. Page Layouts

### Auth Page (`/auth`)

**Layout:**
- Centered card (max-width: 400px)
- Vertical centering
- Background: subtle gradient

**Sections:**
1. Logo + Brand name
2. Google Sign-In button (primary)
3. Divider with "or"
4. Email/Password form
5. Login/Register toggle
6. Terms note

**UX Behavior:**
- Smooth toggle between login/register
- Loading state on submit
- Error messages inline
- Redirect after success

---

### Profile Setup (`/profile/setup`)

**Layout:**
- Centered card (max-width: 500px)
- Progress bar at top

**Sections:**
1. Progress indicator (3 steps)
2. Step 1: Basic Info (age, city, education, occupation)
3. Step 2: Fitness (height, weight, goals, hobbies)
4. Step 3: Buddy preference

**UX Behavior:**
- Next/Back navigation
- Validation before proceeding
- Auto-save draft
- Redirect to /main on complete

---

### Dashboard (`/main`)

**Layout:**
- Full-width container
- Responsive grid

**Sections:**
1. Welcome banner with user stats
2. Today's Workout card
3. Nutrition Summary card
4. Forum Activity card
5. Buddy Matches preview

**UX Behavior:**
- Skeleton loading states
- Pull to refresh
- Quick actions on cards

---

### Forum (`/forum`)

**Layout:**
- Single column, max-width: 800px

**Sections:**
1. Header with "Create Post" button
2. Post list (Reddit-style)

**UX Behavior:**
- Infinite scroll
- Quick preview on hover
- Vote interaction
- Expand to thread

---

### Forum Thread (`/forum/[postId]`)

**Layout:**
- Single column

**Sections:**
1. Back navigation
2. Original post (expanded)
3. Replies (nested, max 4 levels)
4. Reply form (sticky at bottom)

**UX Behavior:**
- Auto-scroll to reply form when replying
- Collapse/expand nested replies
- Optimistic UI on submit

---

### Find Buddy (`/find_a_buddy`)

**Layout:**
- Responsive grid (1-3 columns)

**Sections:**
1. Header with search/filter
2. Buddy cards grid

**UX Behavior:**
- Filter by city/goals
- Send request with feedback
- Requested state shown

---

### Workout Generator (`/workout`)

**Layout:**
- Single column, max-width: 800px

**Sections:**
1. Generate button (prominent)
2. Loading animation during generation
3. Weekly workout display
4. Save button
5. Saved workouts history

**UX Behavior:**
- Clear generate call-to-action
- Progressive loading feedback
- Success confirmation on save

---

### Profile (`/profile`)

**Layout:**
- Centered card (max-width: 600px)

**Sections:**
1. Profile header with avatar
2. Editable fields
3. Save/Cancel buttons (edit mode)

**UX Behavior:**
- View mode by default
- Edit button to enter edit mode
- Auto-save or manual save

---

### How To Guide (`/how_to`)

**Layout:**
- Single column, max-width: 800px

**Sections:**
1. Equipment list (expandable cards)

**UX Behavior:**
- Accordion-style expand/collapse
- Muscle groups as tags

---

## 5. User Flows

### Registration Flow

```
1. User lands on /auth
2. Chooses: Google Sign-In OR Email Register
3. If Google: Popup → Success → Check Firestore
4. If Email: Fill form → Create Account → Check Firestore
5. If user doc doesn't exist → Redirect to /profile/setup
6. Complete profile setup (3 steps)
7. Save to Firestore users/{uid}
8. Redirect to /main (Dashboard)
```

### Posting in Forum Flow

```
1. User navigates to /forum
2. Clicks "Create Post" button
3. Modal/Form appears with title + content
4. Submit → Add to forum_posts collection
5. Post appears at top of list
6. User can click to view thread
```

### Finding Gym Buddy Flow

```
1. User navigates to /find_a_buddy
2. Page loads users where lookingForBuddy == true
3. User browses buddy cards
4. Clicks "Send Buddy Request"
5. Request saved to buddy_requests collection
6. Button changes to "Request Sent"
7. Receiver gets notification (future feature)
```

### Generating Workout Flow

```
1. User navigates to /workout
2. Page fetches user profile (height, weight, fitnessLevel, goals)
3. User clicks "Generate Workout"
4. Loading state shown
5. API call to Gemini with user profile data
6. Gemini returns JSON workout plan
7. Workout displayed on screen
8. User can "Save Workout"
9. Workout saved to workouts collection
```

### Updating Profile Flow

```
1. User navigates to /profile
2. Views current profile data
3. Clicks "Edit Profile"
4. Fields become editable
5. Makes changes
6. Clicks "Save Changes"
7. Updates Firestore document
8. Success message shown
9. Returns to view mode
```

---

## 6. Implementation Notes for Next.js

### Project Structure

```
app/
├── layout.tsx           # Root layout with Navbar
├── page.tsx             # Redirect to /main or /auth
├── globals.css          # Tailwind imports
├── auth/
│   └── page.tsx        # Login/Register
├── profile/
│   ├── setup/
│   │   └── page.tsx    # Onboarding
│   └── page.tsx        # View/Edit profile
├── main/
│   └── page.tsx        # Dashboard
├── forum/
│   ├── page.tsx        # Posts list
│   └── [postId]/
│       └── page.tsx    # Thread view
├── find_a_buddy/
│   └── page.tsx        # Buddy matching
├── workout/
│   └── page.tsx        # Workout generator
└── how_to/
    └── page.tsx        # Equipment guide
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#D1FAE5',
          100: '#A7F3D0',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    }
  },
  plugins: []
}
```

### Global CSS

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply antialiased;
  }
  
  body {
    @apply bg-zinc-50 text-zinc-900;
  }
}

@layer components {
  .card {
    @apply bg-white rounded-2xl shadow-sm border border-zinc-100;
  }
  
  .btn-primary {
    @apply px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium 
           hover:bg-emerald-700 transition-colors disabled:opacity-50;
  }
  
  .btn-secondary {
    @apply px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg font-medium 
           hover:bg-zinc-200 transition-colors;
  }
}
```

---

## Summary

This design system provides:

- **Clean UI**: White backgrounds, subtle shadows, emerald accents
- **Intuitive Navigation**: Top nav for desktop, bottom nav for mobile
- **Consistent Components**: Cards, buttons, inputs follow the same patterns
- **Fast Interactions**: Loading states, smooth transitions
- **Clear Hierarchy**: Headings, tags, and spacing guide the eye
- **Mobile-First**: Responsive grids that work on all screen sizes
