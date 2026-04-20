# Visitor Management System

A full-stack visitor management system with a Node.js backend and HTML/CSS/JavaScript frontend.

## Features

- Add new visitors with validation
- View all visitors in a table
- Delete visitors
- Persistent storage using JSON database
- RESTful API backend

## Project Structure

```
visitor-system/
├── server.js          # Backend server with Express.js and SQLite
├── package.json       # Node.js dependencies
├── visitor_system.db  # SQLite database file (created automatically)
├── README.md          # This file
../
├── login.html         # Login page with visitor/admin options
├── login.js           # Login page JavaScript
├── index.html         # Visitor registration form
├── script.js          # Visitor form JavaScript
├── admin.html         # Admin dashboard
├── admin.js           # Admin dashboard JavaScript
├── style.css          # Shared CSS styles
```

## Installation & Setup

1. **Install Dependencies:**
   ```bash
   cd visitor-system
   npm install
   ```

2. **Start the Backend Server:**
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

3. **Open the Application:**
   Open `login.html` in your browser or visit `http://localhost:3000/login.html`
   cd visitor-system
   npm install
   ```

2. **Start the Backend Server:**
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

3. **Open the Application:**
   Open `index.html` in your browser, or the server will serve it at `http://localhost:3000`

## API Endpoints

- `GET /api/visitors` - Get all visitors
- `POST /api/visitors` - Add a new visitor
- `DELETE /api/visitors/:id` - Delete a visitor by ID
- `PUT /api/visitors/:id` - Update a visitor (for future use)

## Database

The application uses SQLite, a lightweight file-based database. The database file `visitor_system.db` is created automatically when the server starts.

No additional database server setup required - SQLite works out of the box!

## Technologies Used

- **Backend**: Node.js, Express.js, SQLite
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Database**: SQLite (file-based, no server required)

## Development

To modify the backend, edit `server.js`. For frontend changes, modify the files in the root directory.

The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable.