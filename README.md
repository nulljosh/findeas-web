# [Findeas](https://heyitsmejosh.com/findeas-web/)

## Features

### Core Functionality
- **User Registration & Authentication** - JWT-based secure auth system
- **Idea Posting** - Create posts with title, content, and categories
- **Voting System** - Reddit-style upvote/downvote functionality
- **Milestone Tracking** - Automatic business assistance at vote thresholds
- **Categories** - Tech, Business, Social, Entertainment, Other

### Security & Performance
- Input validation and sanitization
- Rate limiting (100 requests/15min, 5 auth attempts/15min)
- CORS protection
- Helmet security headers
- MongoDB injection protection
- Password hashing with bcrypt

### Milestone System
- **10 upvotes**: Business consultation scheduled
- **100 upvotes**: Legal incorporation paperwork initiated  
- **1000 upvotes**: Trademark registration and full business setup

## API Endpoints

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Login with username/password

### Posts
- `GET /posts` - Get all posts (paginated, sortable)
- `POST /posts` - Create new post (auth required)
- `GET /posts/:id` - Get single post with details
- `POST /posts/:id/vote` - Vote on post (auth required)

### Users
- `GET /users/me` - Get own profile (auth required)
- `GET /users/:username` - Get public user profile
- `DELETE /users/me` - Delete own account (auth required)

### Milestones
- `GET /milestones` - View reached milestones
- `POST /milestones/:id/trigger` - Trigger milestone action (admin)

## Setup

### Prerequisites
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

### Installation
```bash
git clone https://github.com/nulljosh/findeas-web
cd findeas-web
npm install
```

### Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
# - Change JWT_SECRET for production
# - Update DATABASE connection string
# - Set FRONTEND_URL for CORS
```

### Running
```bash
# Development (with nodemon)
npm start

# Production
node app.js
```

The server runs on `http://localhost:3030` by default.

## Models

### User
- Username (unique, 3-30 chars, alphanumeric + underscore/hyphen)
- Password (8+ chars, must contain uppercase, lowercase, number)
- Email (optional, unique)
- Posts array (references to user's posts)
- Vote history tracking

### Post
- Title (5-200 chars)
- Content (10-5000 chars)  
- Category (tech/business/social/entertainment/other)
- Author (User reference)
- Vote counts (upvotes, downvotes, score)
- Milestone tracking
- View counter
- Timestamps

## Development

### Getting Started

1. **Clone the repository**
```bash
git clone https://github.com/nulljosh/findeas-web
cd findeas-web
```

2. **Install MongoDB**
```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

3. **Install dependencies**
```bash
npm install
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings (JWT_SECRET, DATABASE, FRONTEND_URL)
```

5. **Start the server**
```bash
npm start  # Development mode with nodemon
# or
node app.js  # Production mode
```

Server runs on `http://localhost:3030` by default.

### Database Indexes
- User: username, email
- Post: author, category, score, upvotes, createdAt

### Security Notes
- All user input is validated and sanitized
- Passwords are bcrypt hashed (salt rounds: 10)
- JWT tokens expire in 24 hours
- Rate limiting prevents abuse
- Admin endpoints require special privileges

[LICENSE](LICENSE)
