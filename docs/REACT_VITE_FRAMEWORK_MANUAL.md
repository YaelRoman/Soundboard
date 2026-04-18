# React & Vite Framework Implementation Manual

## Introduction

**React** is a JavaScript library for building user interfaces with components and reactive state management. **Vite** is a modern build tool that provides fast development and optimized production builds. Together, they enable rapid development of single-page applications (SPAs).

**Why React + Vite:**
- **Fast Development**: Instant HMR (Hot Module Replacement)
- **Component-Based**: Reusable, testable UI pieces
- **Reactive Updates**: Automatic re-render on state change
- **Developer Experience**: Great tooling and error messages
- **Performance**: Optimized production bundles

## React Fundamentals

### 1. Components

Components are reusable pieces of UI. Two types:

**Functional Components (Modern, Recommended):**
```javascript
function Welcome({ name }) {
  return <h1>Hello, {name}</h1>;
}

export default Welcome;
```

**JSX Syntax:**
- Mix HTML-like syntax with JavaScript
- `{}` for expressions
- `className` instead of `class`
- Attribute names are camelCase (onClick, onChange, etc.)

**In SoundBoard:**
- All components are functional (class components deprecated)
- Props for passing data to child components
- Children for nested components

### 2. Hooks for State & Effects

**useState Hook:**
Adds state to functional components.

```javascript
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);  // state, setState
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**Rules:**
- Call hooks at top level (not in loops/conditions)
- Only in functional components
- Each setState call triggers re-render

**In SoundBoard:**
- Form inputs use useState for values
- Loading/error states
- UI toggles (show/hide)
- Data states (boards, sounds, etc.)

**useEffect Hook:**
Runs code after render (side effects).

```javascript
import { useEffect, useState } from "react";

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user data
    api.getUser(userId)
      .then(data => setUser(data))
      .finally(() => setLoading(false));
  }, [userId]);  // Dependency array: re-run if userId changes

  if (loading) return <p>Loading...</p>;
  return <p>Hello, {user.name}</p>;
}
```

**Dependency Array:**
- `[]` - Run once on mount
- `[dependency]` - Run when dependency changes
- Omitted - Run after every render (avoid!)

**Cleanup:**
```javascript
useEffect(() => {
  const unsubscribe = subscribeToUpdates();
  
  return () => {
    // Cleanup function runs on unmount
    unsubscribe();
  };
}, []);
```

**In SoundBoard:**
- Load data on page mount
- Fetch on dependency changes
- Clean up event listeners

**useContext Hook:**
Access global state without prop drilling.

```javascript
const UserContext = createContext();

// In AuthContext provider
<AuthContext.Provider value={{ user, login, logout }}>
  {children}
</AuthContext.Provider>

// In any component
const { user, login } = useContext(AuthContext);
```

**In SoundBoard:**
- AuthContext provides global user state
- Available in all components
- Used for authentication checks

### 3. Props

Pass data from parent to child components.

```javascript
function Parent() {
  const [name, setName] = useState("Alice");
  
  return (
    <Child name={name} onNameChange={setName} />
  );
}

function Child({ name, onNameChange }) {
  return (
    <>
      <p>Name: {name}</p>
      <button onClick={() => onNameChange("Bob")}>
        Change
      </button>
    </>
  );
}
```

**Unidirectional Data Flow:**
- Parent → Child: Props (read-only)
- Child → Parent: Callback functions
- Prevents complex state bugs

**In SoundBoard:**
- Pass board data to BoardCard
- Pass handlers for delete/edit
- Pass user data to display

### 4. Conditional Rendering

```javascript
function App({ isLoggedIn, user }) {
  // Inline ternary
  return isLoggedIn ? <Dashboard user={user} /> : <Login />;
  
  // If statement
  if (!isLoggedIn) return <Login />;
  return <Dashboard user={user} />;
  
  // && operator (render only if true)
  return isLoggedIn && <Dashboard />;
}
```

**In SoundBoard:**
- Show login/register or dashboard based on auth
- Show loading spinner while fetching
- Show empty state if no boards
- Show edit/delete buttons only for owner

### 5. Lists & Keys

```javascript
function BoardList({ boards }) {
  return (
    <div>
      {boards.map(board => (
        <BoardCard key={board.id} board={board} />
      ))}
    </div>
  );
}
```

**Key Importance:**
- `key` helps React identify which items changed
- Use stable IDs (not array index!)
- Ensures correct state when list reorders
- Prevents re-rendering entire list

**In SoundBoard:**
- Board list uses `board.id` as key
- Sound list uses `sound.id` as key

### 6. Form Handling

**Controlled Inputs:**
```javascript
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    api.login(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

**Key Points:**
- Value controlled by React state
- onChange updates state on every keystroke
- onSubmit prevents default and calls handler

**In SoundBoard:**
- Register form: username, email, password inputs
- Create board form: name, description, tags, visibility
- Real-time validation on change

## React Context API

For simple global state (no Redux needed).

### Setup

```javascript
// AuthContext.jsx
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  const login = async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);
  };
  
  const logout = () => {
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext) ?? { user: null };
}
```

### Usage

```javascript
// App.jsx
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* routes here */}
      </Routes>
    </AuthProvider>
  );
}

// Any component
import { useAuth } from "./context/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <>
      <p>Welcome, {user.username}</p>
      <button onClick={logout}>Logout</button>
    </>
  );
}
```

**In SoundBoard:**
- AuthContext is the only global state
- Accessed via `useAuth()` hook
- Provides user, loading, login, register, logout

## Vite Build Tool

### Configuration

`vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

**Plugins:**
- `@vitejs/plugin-react` - Fast Refresh for React
- Automatic JSX transformation
- Hot Module Replacement

### Development Server

```bash
npm run dev
```

**Features:**
- Runs on `http://localhost:5173` (by default)
- Hot Module Replacement (HMR) - instant updates
- Fast Refresh - preserves component state
- Error overlay in browser
- Network tab shows all requests

### Production Build

```bash
npm run build
```

**Output:**
- Creates `dist/` folder
- Minified and optimized files
- Tree-shaking (removes unused code)
- Code splitting (lazy-load components)
- Asset hashing for caching

**Optimization:**
```
dist/
├── index.html              (~1KB)
├── assets/
│   ├── index-abc123.js     (~50KB, minified+gzipped)
│   ├── index-def456.css    (~5KB)
│   └── logo-ghi789.svg     (~2KB)
```

### Environment Variables

Create `.env` and `.env.local` files:

```
# .env
VITE_API_BASE=/api/v1

# .env.local (git ignored)
VITE_API_URL=http://localhost:8000
```

**Usage in Code:**
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

**Rules:**
- Must start with `VITE_` prefix
- Available at build time
- Change requires rebuild

## React Router

Navigation between pages.

### Setup

```javascript
import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/boards/:id" element={<BoardView />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Route Matching:**
- Exact path first
- `:param` for dynamic segments
- `*` for catch-all (404)

### Hooks

**useNavigate:**
```javascript
import { useNavigate } from "react-router-dom";

function LoginForm() {
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    await login();
    navigate("/dashboard");  // Redirect after login
  };
}
```

**useParams:**
```javascript
import { useParams } from "react-router-dom";

function BoardView() {
  const { id } = useParams();  // Get from URL
  // Fetch board with this ID
}
```

**Link Component:**
```javascript
import { Link } from "react-router-dom";

<Link to="/boards/123">View Board</Link>
// Better than <a> for SPA (no page reload)
```

**In SoundBoard:**
- `/login` - Login page
- `/register` - Registration page
- `/me` - User dashboard
- `/explore` - Browse public boards
- `/boards/:id` - Single board view
- `/users/:username` - User profile

### Protected Routes

```javascript
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;
  
  return children;
}

// Usage
<Route path="/me" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
```

## Styling in React

### CSS Modules

Scoped CSS for components.

```javascript
import styles from "./Button.module.css";

export default function Button({ children }) {
  return <button className={styles.btn}>{children}</button>;
}
```

```css
/* Button.module.css */
.btn {
  background: var(--accent-primary);
  padding: 10px 20px;
  border-radius: 4px;
}

.btn:hover {
  opacity: 0.9;
}
```

**Benefits:**
- No naming conflicts
- Clear file organization
- Compile to unique class names
- Can be deleted safely (unused)

**In SoundBoard:**
- Each page/component has `.module.css`
- Classes are scoped to component
- Easy to find and update styles

### Global CSS

Global variables and resets:

```css
/* index.css */
:root {
  --accent-primary: #00f5d4;
  --bg-void: #0a0e27;
  --text-primary: #ffffff;
  --transition-fast: 100ms ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: var(--bg-void);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

**In SoundBoard:**
- Global variables for brand colors
- All components use these variables
- Easy to update theme globally

### Inline Styles

For dynamic styling:

```javascript
function Component({ isError }) {
  return (
    <div style={{
      color: isError ? "red" : "green",
      padding: "10px"
    }}>
      Status
    </div>
  );
}
```

**When to use:**
- Dynamic styles based on props/state
- One-off overrides
- Avoid for static styles (use CSS Modules)

**In SoundBoard:**
- Used for hint colors (green/red validation)
- Dynamic color based on validation state

## Common Patterns

### Fetch Data Pattern

```javascript
useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getBoards();
      setBoards(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  loadData();
}, []);
```

### Form Submission Pattern

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setSubmitting(true);
  
  try {
    const result = await api.createBoard(formData);
    onSuccess(result);
  } catch (err) {
    if (err.fieldErrors) {
      setFieldErrors(err.fieldErrors);
    } else {
      setError(err.message);
    }
  } finally {
    setSubmitting(false);
  }
};
```

### Conditional Rendering Pattern

```javascript
if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (items.length === 0) return <EmptyState />;

return (
  <div>
    {items.map(item => <Item key={item.id} {...item} />)}
  </div>
);
```

## Best Practices

1. **One Responsibility Per Component**: Each component does one thing
2. **Lift State Up**: Move shared state to parent
3. **Use Hooks**: useState, useEffect, useContext for state
4. **Prop Drilling**: Use Context API to avoid deeply nested props
5. **Keys in Lists**: Always use stable, unique keys
6. **Dependencies**: Include all dependencies in useEffect
7. **Fragments**: Use `<>...</>` to avoid extra divs
8. **Event Handlers**: Bind or arrow functions for `this`
9. **Prevent Re-renders**: Use React.memo for expensive components
10. **Error Boundaries**: Catch errors to prevent app crash

## Performance Optimization

### Code Splitting

```javascript
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));

<Suspense fallback={<Spinner />}>
  <Dashboard />
</Suspense>
```

Loads component JavaScript only when needed.

### memoization

```javascript
import { memo } from "react";

const BoardCard = memo(function BoardCard({ board }) {
  return <div>{board.name}</div>;
});
```

Prevents re-render if props haven't changed.

## Debugging

**React DevTools Browser Extension:**
- Inspect component hierarchy
- Watch state changes
- Edit props/state for testing
- Track re-renders

**Console Logging:**
```javascript
useEffect(() => {
  console.log("Component mounted or dependency changed");
  return () => console.log("Component unmounted");
}, [dependency]);
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Infinite render loops | Add dependencies to useEffect |
| State not updating | Don't mutate state directly |
| Props not updating child | Lift state to parent |
| Component not re-rendering | Check key in list |
| Memory leaks | Clean up effects (timers, subscriptions) |

## Resources

- [React Official Docs](https://react.dev/)
- [Vite Official Docs](https://vitejs.dev/)
- [React Router Docs](https://reactrouter.com/)

---

**Last Updated**: 2026-04-15
**React Version**: 18.3.1
**Vite Version**: 5.4.0
