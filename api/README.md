# Git Canvas Notes API

Backend API for Git Canvas Notes application.

## 🏗️ Architecture

```
api/
├── src/
│   ├── models/          # Database models (User, Folder, Note)
│   ├── routes/          # Express routes (auth, folders, notes)
│   ├── usecases/        # Business logic layer
│   ├── database/        # Database configuration and schema
│   ├── middleware/      # Authentication middleware
│   └── server.js        # Express server setup
├── package.json
└── .env
```

## 🚀 Setup

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Configure Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=3001
NODE_ENV=development

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:5173/auth/callback

JWT_SECRET=your_random_secret_here

FRONTEND_URL=http://localhost:5173
```

### 3. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The API will be available at: `http://localhost:3001`

## 📡 API Endpoints

### Authentication

#### POST `/api/auth/github`
Authenticate with GitHub OAuth code.

**Request:**
```json
{
  "code": "github_oauth_code"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": {
    "id": 1,
    "githubId": 12345,
    "username": "johndoe",
    "name": "John Doe",
    "email": "john@example.com",
    "avatarUrl": "https://..."
  }
}
```

### Folders

All folder endpoints require `Authorization: Bearer <token>` header.

#### GET `/api/folders`
Get all folders for authenticated user.

#### GET `/api/folders/:id`
Get specific folder.

#### POST `/api/folders`
Create new folder.

**Request:**
```json
{
  "id": "folder-uuid",
  "name": "My Folder"
}
```

#### PUT `/api/folders/:id`
Update folder name.

**Request:**
```json
{
  "name": "Updated Name"
}
```

#### DELETE `/api/folders/:id`
Delete folder (cascades to notes).

### Notes

All note endpoints require `Authorization: Bearer <token>` header.

#### GET `/api/notes`
Get all notes for authenticated user.

Query params:
- `folderId` (optional): Filter by folder

#### GET `/api/notes/pending`
Get notes pending GitHub sync.

#### GET `/api/notes/:id`
Get specific note.

#### POST `/api/notes`
Create new note.

**Request:**
```json
{
  "id": "note-uuid",
  "folderId": "folder-uuid",
  "title": "My Note",
  "type": "text",
  "content": "Note content...",
  "thumbnail": "data:image/png;base64,...",
  "canvasBackground": "grid",
  "path": "notes/my-note.md",
  "githubSha": null,
  "syncStatus": "pending"
}
```

#### PUT `/api/notes/:id`
Update note.

**Request:**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "syncStatus": "synced",
  "githubSha": "abc123..."
}
```

#### DELETE `/api/notes/:id`
Delete note.

## 🗄️ Database

Uses SQLite with `better-sqlite3` for simplicity.

**Schema:**
- `users` - GitHub user information and tokens
- `folders` - User folders
- `notes` - Text and drawing notes

The database file is created automatically at `api/database.db`.

## 🔐 Security

- GitHub Client Secret is kept secure on the backend
- JWT tokens for authentication
- User data isolation (users can only access their own data)
- Input validation on all endpoints

## 🧪 Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:3001/api/health

# Create folder (requires auth token)
curl -X POST http://localhost:3001/api/folders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":"test-id","name":"Test Folder"}'
```

## 📝 Notes

- The database is automatically initialized on server start
- Foreign keys are enabled for referential integrity
- Deleting a folder will cascade delete all its notes
- All timestamps are in UTC
