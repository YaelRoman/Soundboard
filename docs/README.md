# SoundBoard Project Documentation

Welcome to the SoundBoard development documentation. This comprehensive guide covers all aspects of the project architecture, implementation, and development workflow.

## Documentation Structure

### Development Guides

These guides document how the SoundBoard application is built and structured:

1. **[Backend Development Guide](./BACKEND_DEVELOPMENT.md)**
   - Project structure and organization
   - Core components (authentication, database, API endpoints)
   - Key implementation details
   - Data models and access control
   - Known issues and TODOs
   - **Audience**: Backend developers, API consumers
   - **Content**: Architecture, endpoints, patterns, best practices

2. **[Frontend Development Guide](./FRONTEND_DEVELOPMENT.md)**
   - Project structure and components
   - State management (Context API)
   - Page structures and features
   - Styling system (CSS Modules)
   - Routing and navigation
   - **Audience**: Frontend developers, UI designers
   - **Content**: Components, pages, state, styling, routing

### Framework Implementation Manuals

Detailed guides on the frameworks and libraries used:

3. **[FastAPI Framework Manual](./FASTAPI_FRAMEWORK_MANUAL.md)**
   - Core FastAPI concepts and architecture
   - Dependency injection system
   - Validation and error handling
   - Security and authentication
   - Middleware and configuration
   - Common patterns and best practices
   - **Audience**: Developers new to FastAPI
   - **Content**: How to use FastAPI, patterns, concepts

4. **[React & Vite Framework Manual](./REACT_VITE_FRAMEWORK_MANUAL.md)**
   - React fundamentals (components, hooks, state)
   - Context API for state management
   - React Router for navigation
   - Vite build tool and configuration
   - Styling in React (CSS Modules)
   - Performance optimization
   - **Audience**: Developers new to React/Vite
   - **Content**: How to use React, Vite patterns, concepts

## Quick Start

### For Backend Development

1. Read **Backend Development Guide** first for overview
2. Reference **FastAPI Framework Manual** for specific concepts
3. Check API endpoints at `http://localhost:8000/docs` (Swagger UI)

### For Frontend Development

1. Read **Frontend Development Guide** first for overview
2. Reference **React & Vite Framework Manual** for specific concepts
3. Start dev server: `npm run dev` (port 5173)

## Key Technologies

**Backend:**
- FastAPI 0.111.0+ - Web framework
- SQLAlchemy 2.0.30+ - ORM
- Pydantic 2.10.0+ - Validation
- JWT - Authentication
- SQLite - Database

**Frontend:**
- React 18.3.1 - UI library
- Vite 5.4.0 - Build tool
- React Router 6.26.0 - Navigation
- CSS Modules - Styling

## Project Overview

### What is SoundBoard?

SoundBoard is a collaborative platform for managing and sharing sound effects and audio files. Users can:
- Create and organize soundboards (collections of sounds)
- Upload and manage audio files
- Share boards publicly or keep them private
- Browse and discover sounds from other users
- Tag and search sounds

### Architecture

```
┌─────────────────┐
│   Frontend      │  React + Vite
│   (React SPA)   │  Port 5173
└────────┬────────┘
         │ (HTTP/REST)
┌────────▼────────┐
│    Backend      │  FastAPI
│  (API Server)   │  Port 8000
└────────┬────────┘
         │ (SQL)
┌────────▼────────┐
│    Database     │  SQLite
│   (soundboard)  │  sqlite:///soundboard.db
└─────────────────┘
```

## Development Workflow

### Setting Up

1. **Backend:**
   ```bash
   python -m venv venv
   venv/Scripts/activate  # Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`

### Making Changes

**Backend:**
1. Update model or schema
2. Implement service logic
3. Add API route
4. Test in Swagger UI (`/docs`)

**Frontend:**
1. Update component or page
2. Use `api.method()` for backend calls
3. Vite auto-refreshes on save
4. Test in browser

## Common Development Tasks

### Adding a New API Endpoint

See **Backend Development Guide** → Common Development Tasks → Adding a New Endpoint

### Adding a New Page/Component

See **Frontend Development Guide** → Common Development Tasks → Adding a New Page

### Understanding Validation Errors

See **Frontend Development Guide** → API Integration → Error Handling

### Working with State

See **React & Vite Manual** → React Fundamentals → Hooks for State & Effects

## Documentation Goals

These guides aim to:
- ✅ Document the current architecture and design
- ✅ Explain key concepts and implementation patterns
- ✅ Guide new developers in understanding the codebase
- ✅ Provide reference for framework features
- ✅ Record design decisions and rationale
- ✅ Leave space for screenshots and diagrams

## Image Placeholders

Throughout the documentation, you'll find sections marked:
```
[Space for screenshots/diagrams]
```

These are places where visual aids can be added to help explain concepts:
- Architecture diagrams
- Component trees
- Database schema
- UI mockups
- Workflow diagrams
- Code examples

## Contributing Documentation

When adding new features or making significant changes:
1. Update relevant development guide
2. Add framework concepts to manuals if needed
3. Include code examples where helpful
4. Add screenshots/diagrams for complex concepts

## Glossary

**SPA**: Single Page Application - JavaScript app that runs in browser
**ORM**: Object-Relational Mapping - Maps database tables to code objects
**JWT**: JSON Web Token - Stateless authentication token
**CORS**: Cross-Origin Resource Sharing - Browser security for API calls
**HMR**: Hot Module Replacement - Instant updates during development
**Validation**: Ensuring input data is correct format/values
**Middleware**: Code that runs before/after each request

## Troubleshooting

**Backend not connecting from frontend?**
- Check CORS config in `app/main.py`
- Verify backend running on port 8000
- Check browser console for error messages

**Frontend changes not appearing?**
- Check if Vite dev server still running
- Hard refresh browser (Ctrl+Shift+R)
- Check console for errors

**Database issues?**
- Delete `soundboard.db` to reset
- Re-run backend to initialize
- Check `app/db/init_db.py`

**Authentication failing?**
- Check tokens in localStorage (DevTools → Application)
- Verify JWT secret key matches (`app/config.py`)
- Check user exists in database

## Resources

### Official Documentation
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [React Router Docs](https://reactrouter.com/)

### Learning Resources
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [React Tutorial](https://react.dev/learn)
- [MDN Web Docs](https://developer.mozilla.org/)

## Project Status

**Current Version**: 2.0.0

**Completed Features:**
- ✅ User registration and authentication
- ✅ Board creation and management
- ✅ Sound file upload and streaming
- ✅ Public board browsing
- ✅ Tag-based searching and filtering
- ✅ User profiles
- ✅ Real-time validation feedback
- ✅ Rate limiting

**Known Issues:**
[See relevant development guides for current issues]

**In Progress:**
[Space for current development tasks]

---

**Last Updated**: 2026-04-15  
**Version**: 2.0.0  
**Maintained By**: Development Team
