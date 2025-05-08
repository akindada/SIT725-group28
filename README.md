
## DAILY MOOD TRACKER – System Architecture, Functionality & Recommendations

### OVERVIEW
The Daily Mood Tracker App is a full-stack web application developed to help users log, monitor, and understand their emotional states over time. It integrates authentication, mood tracking, history analysis, and admin functionality. The application is powered by Node.js, Express, MongoDB, and a responsive HTML/CSS/JS frontend, ensuring seamless interaction between users and their emotional wellness data.

## Folder Structure Overview

daily-mood-tracker/
│
├── controllers/
│   ├── authController.js
│   └── moodController.js
├── middleware/
│   ├── authenticate.js
│   └── rbac-admin.js
├── models/
│   ├── Mood.js
│   └── User.js
├── public/
│   ├── CSS/
│   │   └── styles.css
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── history.html
│   ├── profile.html
│   ├── JS/
│   │   ├── register.js
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   └── admin.js
├── .env
├── server.js
└── package.json

## Features
✅ User Registration & Login (JWT-based authentication)
📝 Submit mood entries daily
📈 View mood trends on the dashboard
🔒 Secure password hashing using bcryptjs
🔧 RESTful API design using Express.js
🧠 Real-time support with Socket.IO (optional future extension)

### Tech Stack
This section defines the layer technologies
- Frontend:	HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB (via Mongoose)
- Auth: JSON Web Tokens (JWT), bcryptjs
- Real-time: Socket.IO

## Frontend Functionality Overview

- index.html – Home Page and display the introduction to the app, links to login and register.
- register.html – User Registration: Collects user data and sends it to the backend via register.js.
- login.html – User Login: Authenticates user, stores JWT on success.
- dashboard.html – Mood Tracking Interface and Users select moods and submit via dashboard.js.
- history.html – Mood History and displays timeline or chart of mood entries using GET API.
- profile.html – User Profile and displays user data and logout functionality.
- admin.html – Admin Dashboard, admin homepage which is accessible only to admins to view all user moods.

## Backend Architecture & Functionality

- server.js: Initializes Express app, MongoDB connection, and routes.
- authController.js: Handles registration and login endpoints.
- moodController.js: Handles mood save and fetch for users/admin.
- authenticate.js: JWT verification middleware.
- rbac-admin.js: Admin role verification.
- User.js: Schema for user details and roles.
- Mood.js: Schema for mood entries linked to users.

## MongoDB Integration

The app connects to MongoDB Atlas using credentials from the .env file. It uses two collections: 'users' and 'moods'. 'users' store registration and roles, while 'moods' store user mood entries with timestamps.

## Unit Testing (Recommendation Section)

* Recommended tests with Postman
:
- POST /api/auth/register – should create user and return token.
- POST /api/auth/login – should authenticate and return token.
- GET /api/moods/history – should return mood entries of user.
- POST /api/moods – should save mood for token user.
- GET /api/moods/admin – only accessible to admins.
- RBAC Middleware – restrict access if not admin.
- Authentication Middleware – reject invalid/missing tokens.

## API Endpoints
* Auth APIs
- POST /api/auth/register – Register a new user.
- POST /api/auth/login – Authenticate and return JWT.

* Mood APIs
- POST /api/moods – Add new mood entry (requires token).
- GET /api/moods/history – Get user’s mood history.
- GET /api/moods/admin – Admin access to all mood logs.

## Security Considerations

- Passwords are hashed using bcrypt. 
- JWT is used for secure token-based authentication. 
- Admin role is protected using RBAC middleware. 
- MongoDB uses parameterized queries.

## Scalability & Future Enhancements
- Graph Visualizations (charts for mood trends).
- Email Alerts for consistent negative mood.
- Daily Reminders via scheduled jobs.
- Export mood data to PDF/CSV.




 ## Installation
* Clone the repository: git clone  https://github.com/akindada/SIT725-groupWRK.git
* Install dependencies

## Start the server 
* node server.js
* Open in browser:Visit http://localhost:5000


