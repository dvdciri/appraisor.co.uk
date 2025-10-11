# Estimo - Property Analysis Platform

A Next.js application for property analysis and management with Todoist integration for task management.

## Features

- Property search and analysis
- Property lists management
- Task management powered by Todoist API
- Calculator for property investments
- Recent properties tracking

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Todoist account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   TODOIST_API_KEY=your_todoist_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Getting Your Todoist API Key

1. Log in to your Todoist account
2. Go to Settings → Integrations: https://todoist.com/prefs/integrations
3. Scroll down to "API token"
4. Copy your API token
5. Add it to your `.env.local` file as `TODOIST_API_KEY`

**Note:** The app automatically creates an "estimo" label in Todoist when you create your first task. This label helps separate property-related tasks from your personal tasks. All tasks created through the app will have this label.

### Running the Application

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## Tasks Feature

The Tasks section allows you to:
- Create tasks associated with properties
- Set due dates and times for tasks (reminders are automatically set)
- Filter tasks by property to focus on specific properties
- Navigate directly to tasks for a specific property from the property details page
- View all your property-related tasks in one place (filtered by "estimo" label)
- Complete or delete tasks
- Click on property links to view property details

All tasks are synced with Todoist with the "estimo" label, keeping them separate from your personal tasks!

**Technical Note:** The app only stores the connection between tasks and properties locally. All task details (name, description, due dates, etc.) are always fetched from Todoist, ensuring that any changes you make in Todoist are immediately reflected in the app.

## Project Structure

- `/app` - Next.js app directory
  - `/api` - API routes
  - `/components` - Reusable React components
  - `/` (root) - Search page with all saved properties
  - `/tasks` - Tasks page
  - `/lists` - Property lists management
- `/lib` - Utility functions and data persistence
- `/types` - TypeScript type definitions

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Todoist API
- localStorage for data persistence


