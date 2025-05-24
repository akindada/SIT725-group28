
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
- admin-dashbaord.html – Admin Dashboard, admin homepage which is accessible only to admins to view all user moods.

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

## API Endpoints
* Auth APIs
- POST /api/auth/register – Register a new user.
- POST /api/auth/login – Authenticate and return JWT.

* Mood APIs
- POST /api/moods – Add new mood entry (requires token).
- GET /api/moods/history – Get user’s mood history.
- GET /api/moods/admin – Admin access to all mood logs.

### Performing Unit Test and Manual Test on both admin and regular user functionalities

## Steps taken to carry out Unit functionality test
* Test was done using Mocha, Chai, and Chaihttp
* Test folder was created in the root folder, and test file "admin.test.js" was created to perform unit test.
* Test performed was successful and screenshots are saved in test/test output images/Admin test images

### Admin API Postman Testing Instructions
This document describes how to test the Admin API endpoints manually using Postman.

## Steps
1. Open Postman.
## Environment Setup
In Postman, Save token via the Authorization header to headers tab
### 1. Test Create Admin
Use POST (http://localhost:5000/admin/register)
- Response status should be 201.
- The response should contain the created admin user details. (Evidence is saved as POSTMAN admin-created image)
### 2. Test Admin Login
- Run the `Admin Login` request (http://localhost:5000/admin/login)
- On success, the response status should be 200, (Evidence is saved as POSTMAN admin-login image)
- The token will be automatically saved as an environment variable `token` for use in subsequent requests.
### 3. Get All Admins
- Run the `Get All Admins` request (http://localhost:5000/admin/dashboard)
- This uses the token from login automatically via the Authorization header.
- Response status should be 200, (Evidence is saved as POSTMAN Get-admin image)
- The response body should be an array of admin users.
### 4. Update Admin user
- Run the `Put method` request (http://localhost:5000/admin/users/userID/edit)
- This uses the token from login automatically via the Authorization header.
- Response status should be 200, (Evidence is saved as POSTMAN Update-admin image)
- The response body should be an array of admin users.
### 5. Suspend User
- Run the `Put method` request (http://localhost:5000/admin/users/userID/suspend)
- This uses the token from login automatically via the Authorization header.
- Response status should be 200, (Evidence is saved as POSTMAN Suspend-user image)
- Repeat step to unsuspend user, (Evidence is saved as POSTMAN Unsuspend-user image)
### 5. Delete User
- Run the `Put method` request (http://localhost:5000/admin/users/userID)
- This uses the token from login automatically via the Authorization header.
- Response status should be 200, (Evidence is saved as POSTMAN Delete-user image)
### 5. Get Analytics
- Run the `Get method` request (http://localhost:5000/admin/analytics)
- This uses the token from login automatically via the Authorization header.
- Response status should be 200, (Evidence is saved as POSTMAN Admin-analytics image)

### Admin Test Execution Results
- All tests passed successfully.
- Included detailed console logs showing token extraction and request headers.
- Verified MongoDB connection stability throughout testing.

### Regular User API Postman Testing Instructions
In this part, we provide step-by-step guidance for testing the application API using Postman. The API supports user registration, login, and mood tracking functionality.

## Register a New User
Use POST (http://localhost:5000/api/users/register)
- Response status should be 201.
- The response should contain the created user token and role. (Evidence is saved as POSTMAN user-created image)

## Login a User
Use POST (http://localhost:5000/api/users/login)
- Response status should be 201.
- The response should contain the successful message. (Evidence is saved as POSTMAN user-login image)

## Submit Moods
Use POST (http://localhost:5000/api/moods)
- Response status should be 201.
- The response should contain the successful message. (Evidence is saved as POSTMAN submit-mood image)

## Get Mood History
Use GET (http://localhost:5000/api/moods)
- Response status should be 200.
- The response should contain the successful message. (Evidence is saved as POSTMAN get-mood image)

## Update Mood Description
Use PUT (http://localhost:5000/api/moods/moodID)
- Response status should be 200.
- The response should contain the successful message. (Evidence is saved as POSTMAN update-mood image)

### Security Considerations
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
* Install dependencies ( nodejs, MongoDb, Dotenv, Cor, Express, Mocha, Chai and Supertest)

### Build and Run App using Docker
# Build Docker image
docker build -t mood-reminder-app .
# Run Docker container with environment file
docker run -p 5000:5000 --env-file .env mood-reminder-app

## Start the server 
* node server.js
* Open in browser:Visit http://localhost:5000 for regular user
* Open in browser:Visit http://localhost:5000/admin for admin user



