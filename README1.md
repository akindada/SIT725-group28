## Reminder System Testing Documentation

## Overview
This document provides a comprehensive overview of the testing procedures and outcomes for the Reminder System. Both automated unit testing using npm test and manual API testing using Postman were conducted to ensure the reliability and correctness of the system's CRUD functionalities.

## Automated Unit Testing 
Automated unit tests were executed using the command `npm test`. 

## Covered Test Cases
The following Reminder API operations were covered:
- Create Reminder
- Get All Reminders
- Get Upcoming Reminders
- Update Reminder
- Delete Reminder
All unit tests passed successfully, confirming that the backend logic and database operations for reminders are functioning as expected.

## Manual API Testing with Postman
After successful unit testing, manual API testing was conducted using Postman to validate the endpoints in a real-world scenario.

## Tested Endpoints
1. GET All Reminders
URL: GET http://localhost:5000/api/reminders
Result: Successfully retrieved all saved reminders from the database.
2. GET Upcoming Reminders
URL: GET http://localhost:5000/api/reminders/upcoming
Result: Successfully retrieved only the upcoming reminders with future reminderDate values.
3. PUT Update Reminder
URL: PUT http://localhost:5000/api/reminders/:id
Body: JSON object with updated message or reminderDate
Result: Successfully updated the specified reminder and verified changes.
4. DELETE Reminder
URL: DELETE http://localhost:5000/api/reminders/:id
Result: Successfully deleted the specified reminder and confirmed removal from the database.

## Conclusion
The Reminder System passed both automated and manual testing phases. The CRUD operations are fully functional, and the API behaves correctly under test scenarios. The testing validated data creation, retrieval, update, and deletion flows as per requirements.


