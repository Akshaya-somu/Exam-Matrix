# Exam Matrix - Local Development Instructions

## Prerequisites
- [Node.js](https://nodejs.org/) (Version 20 or higher recommended)
- A terminal/command prompt

## How to Run Locally

1. **Download the Code**
   - Download the project files as a ZIP from Replit or clone the repository.
   - Extract the files to a folder on your computer.

2. **Install Dependencies**
   - Open your terminal and navigate to the project folder.
   - Run the following command:
     ```bash
     npm install
     ```

3. **Start the Application**
   - Since this is a frontend prototype, you can run the client directly:
     ```bash
     npm run dev:client
     ```
   - This will start the Vite development server (usually at http://localhost:5000).

## Project Structure
- `client/src`: Contains all the frontend React code.
- `client/src/pages`: The main page views (Dashboard, Exam, Landing).
- `client/src/components`: Reusable UI components.

## Notes
- This is a **frontend-only prototype**. The backend features (database, real AI processing) are simulated in the frontend code.
- No database setup is required to run this version.
