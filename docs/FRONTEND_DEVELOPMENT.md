# SoundBoard Frontend Development Guide

## Overview

The SoundBoard frontend is a modern single-page application (SPA) built with React and Vite, providing an intuitive interface for managing collaborative soundboards. The frontend handles user authentication, board browsing and creation, sound playback, and real-time collaboration features.

**Technology Stack:**
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.0 (fast bundling and HMR)
- **Routing**: React Router 6.26.0
- **State Management**: React Context API (built-in, no Redux)
- **HTTP Client**: Fetch API (native browser)
- **Styling**: CSS Modules (component-scoped styles)
- **Development Server**: Vite dev server (Hot Module Replacement)

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx              # Login page form
│   │   ├── Register.jsx           # Registration page form with validation
│   │   ├── Dashboard.jsx          # User's boards page
│   │   ├── Explore.jsx            # Browse public boards
│   │   ├── BoardView.jsx          # Single board view with sounds
│   │   ├── UserProfile.jsx        # View user profiles
│   │   └── Auth.module.css        # Shared styles for auth pages
│   ├── components/
│   │   ├── BoardCard.jsx          # Reusable board preview card
│   │   ├── SoundButton.jsx        # Sound playback button
│   │   ├── Sidebar.jsx            # Navigation sidebar
│   │   ├── WaveformVisualiser.jsx # Audio visualization
│   │   ├── TagChip.jsx            # Tag display component
│   │   ├── ErrorBoundary.jsx      # Error handling wrapper
│   │   └── *.module.css           # Component-scoped styles
│   ├── context/
│   │   └── AuthContext.jsx        # User auth state & methods (global)
│   ├── api/
│   │   └── client.js              # API client with error handling
│   ├── App.jsx                    # Root component with routes
│   ├── App.module.css             # Global styles
│   ├── main.jsx                   # Vite entry point
│   └── index.css                  # Global CSS variables
├── vite.config.js                 # Vite configuration
└── package.json                   # Dependencies and scripts
```

## Core Components

### 1. Authentication System

**AuthContext (Global State)**
- Maintains logged-in user state
- Provides login/register/logout methods
- Auto-loads user on page load
- Handles token refresh on 401 errors
- Shared across entire app via Context API

**Login Flow:**
1. User visits `/login` and enters email/password
2. Submit calls `api.login(email, password)`
3. Backend returns access_token, refresh_token, user
4. Tokens stored in localStorage
5. User state updated globally
6. Redirected to dashboard

**Registration Flow:**
1. User visits `/register` and enters username/email/password
2. Real-time validation hints as they type
3. Submit calls `api.register(username, email, password)`
4. Backend validates and returns tokens
5. Same token storage and redirect as login

**Token Refresh:**
- Access token expires after 30 minutes
- API client automatically sends refresh_token to get new access_token
- If refresh fails, tokens cleared and user redirected to login

### 2. Page Components

**Login & Register Pages:**
- Minimalist glass-morphism UI
- Form validation with real-time feedback
- Error messages displayed below form fields
- Placeholder hints for requirements

**Dashboard (My Boards):**
- Shows boards owned by current user
- Create new board form (name, description, tags, visibility)
- Grid layout of board cards
- Delete board with confirmation
- Paginated loading (100 boards per request)

**Explore Page:**
- Browse all public boards
- Search by name/description
- Filter by tags (multiple selection)
- Pagination controls
- Shows board owner and metadata

**Board View:**
- Single board details
- Sound buttons for playback
- Edit/delete board (owner only)
- Add sounds to board
- Tag display
- Sound list with controls

**User Profile Page:**
- View public user profile
- Show user's boards
- Avatar display
- Account creation date

### 3. Reusable Components

**BoardCard:**
- Preview card for a board
- Shows name, description, owner
- Sound count
- Clickable to view board
- Delete button (if owner)

**SoundButton:**
- Plays/stops audio
- Visual feedback during playback
- Duration display
- Download link

**Sidebar:**
- Navigation menu
- Links to Dashboard, Explore, Profile
- Logout button
- User avatar/name display

**WaveformVisualiser:**
- Real-time audio frequency visualization
- Animated bars during playback
- Canvas-based rendering

**TagChip:**
- Displays a single tag
- Styled badge appearance
- Removable (clickable X)

**ErrorBoundary:**
- Catches React errors
- Displays fallback UI
- Prevents app crash

### 4. State Management

**Context API (No Redux):**
- Global auth state via AuthContext
- User, loading, login/register/logout methods
- Automatically synced across all components

**Local Component State:**
- Form inputs (useState)
- Loading/error states
- UI toggles (show/hide form, etc.)

**Data Fetching:**
- Fetch from API client methods
- Store in component state
- Re-fetch on dependency changes

**Example Pattern:**
```javascript
const [boards, setBoards] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  api.getMyBoards()
    .then(data => setBoards(data.items))
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, []);
```

## API Integration

### Client Methods (frontend/src/api/client.js)

**Authentication:**
- `register(body)` - POST /auth/register
- `login(email, password)` - POST /auth/login (OAuth2 form)
- `refresh(refreshToken)` - POST /auth/refresh

**Users:**
- `getMe()` - GET /users/me (current user)
- `updateMe(body)` - PUT /users/me
- `getUser(username)` - GET /users/{username}
- `getUserBoards(username)` - GET /users/{username}/boards

**Boards:**
- `getBoards(params)` - GET /boards/ (public, pageable)
- `getMyBoards(params)` - GET /boards/my (owner's boards)
- `getTags()` - GET /boards/tags (all unique tags)
- `getBoard(id)` - GET /boards/{id} (single board)
- `createBoard(body)` - POST /boards/
- `updateBoard(id, body)` - PUT /boards/{id}
- `deleteBoard(id)` - DELETE /boards/{id}

**Sounds:**
- `uploadSound(formData)` - POST /sounds/upload
- `getSound(id)` - GET /sounds/{id}
- `updateSound(id, body)` - PUT /sounds/{id}
- `deleteSound(id)` - DELETE /sounds/{id}
- `streamUrl(id)` - Returns URL for audio <audio> tag

### Error Handling

**Request Function:**
- Sends Bearer token in Authorization header
- Auto-refreshes on 401 (one retry)
- Parses error responses
- Throws ApiError with status and optional fieldErrors

**Field-Specific Errors (422):**
- Backend returns validation errors as detail array
- Client parses: `{ username: "error msg", password: "error msg" }`
- Components display errors below form fields

**Generic Errors:**
- Non-422 errors treated as generic
- Display in error banner
- User can retry or navigate away

## Styling System

### CSS Modules (Component-Scoped)

Each component has a `.module.css` file:

```css
/* Auth.module.css */
.form { /* scoped to Auth components */ }
.input { /* won't conflict with other .input */ }
.error { /* red error styling */ }
```

**Benefits:**
- No global CSS conflicts
- Easy to delete unused styles
- Clear component-style relationships
- Class names can be simple/generic

### Global Styles

`index.css` defines CSS custom properties (variables):
- `--accent-primary`: Main brand color (teal)
- `--accent-danger`: Error/danger color (red)
- `--bg-void`: Dark background
- `--text-primary`, `--text-secondary`, `--text-muted`: Text colors
- `--transition-fast`: Animation timing

All components reuse these variables for consistency.

### Layout Patterns

**Glass Morphism:**
- Semi-transparent background
- Backdrop blur effect
- Used on forms and cards

**Grid Layout:**
- Board cards in responsive grid
- Auto-fit columns

**Flexbox:**
- Navigation and form layouts
- Alignment and spacing

## Routing

React Router 6 structure:

```javascript
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/me" element={<Dashboard />} />
    <Route path="/explore" element={<Explore />} />
    <Route path="/boards/:id" element={<BoardView />} />
    <Route path="/users/:username" element={<UserProfile />} />
  </Routes>
</BrowserRouter>
```

**Protected Routes:**
- Dashboard, board edit require authentication
- Redirect to login if not authenticated
- Check `user` state from AuthContext

**Dynamic Routes:**
- `/boards/:id` - Get board ID from URL params
- `/users/:username` - Get username from URL params
- Use `useParams()` to access

## Development Workflow

### Starting the Dev Server

```bash
cd frontend
npm install              # One-time: install dependencies
npm run dev            # Start Vite dev server (port 5173)
```

**Features:**
- Hot Module Replacement (HMR) - changes appear instantly
- Fast refresh (preserves component state)
- Error overlay in browser
- API calls proxied to localhost:8000

### Building for Production

```bash
npm run build           # Creates optimized dist/ folder
npm run preview         # Preview production build locally
```

**Optimization:**
- Minification and tree-shaking
- Code splitting (dynamic imports)
- CSS modules compiled to minimal CSS
- Assets hashed for caching

## Key Features Implemented

### Real-Time Validation (Register Page)

- Username: Check 3-30 characters, alphanumeric+underscore
- Password: Check 8+ characters, show character count
- Email: Check @ symbol present
- Hints show green (✓) when valid, red (✗) when invalid
- Submit-time errors shown in red below fields
- Errors persist until next submit

### Pagination

- Boards loaded with page/size params
- "Load more" button or pagination controls
- Prevents fetching 10,000 items at once

### Search & Filter

- Search input sends query to API
- Tag selection for multi-tag filtering
- URL params for bookmarkable searches

### File Upload

- Multipart/form-data upload for sounds
- Progress tracking
- Error handling

## Performance Considerations

- **Code Splitting**: Pages lazy-loaded with React.lazy()
- **Image Optimization**: Icons as SVG or small PNG
- **Caching**: Tokens in localStorage, API responses could cache
- **Bundle Size**: Vite produces small bundles (~200KB gzipped)

## Common Development Tasks

### Adding a New Page

1. Create `pages/NewPage.jsx`
2. Add route in `App.jsx`
3. Add navigation link in Sidebar
4. Use `useAuth()` for auth context
5. Use `api.method()` for backend calls

### Adding a New Component

1. Create `components/NewComponent.jsx`
2. Create `components/NewComponent.module.css`
3. Import and use in pages

### Styling a Component

1. Create `.module.css` for component
2. Import styles: `import styles from "./Component.module.css"`
3. Apply: `className={styles.className}`
4. Use global variables from index.css

### Form Validation

1. Add state for field value and errors
2. Add onChange handlers
3. Add validation function (client-side)
4. Display validation hints below input
5. Handle API errors on submit

## Known Issues & TODOs

[Space for known issues to be documented]

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ JavaScript
- CSS custom properties required

## Testing

[Space for testing guidelines]

## Deployment

[Space for deployment instructions]

---

**Last Updated**: 2026-04-15
**React Version**: 18.3.1
**Vite Version**: 5.4.0
**Node Version**: 18.0.0+ required
