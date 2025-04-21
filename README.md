# Eisenhower Matrix Task Manager

A simple, static web application for task management using the Eisenhower Matrix (also known as the Urgent-Important Matrix).

## Features

- Create tasks with title and description
- Drag and drop tasks into the appropriate quadrants
- Local storage persistence (tasks and theme preferences are saved)
- Dark mode support
- Responsive design for mobile and desktop
- No external libraries or frameworks - pure HTML, CSS, and JavaScript

## Usage

1. Enter a task title and optional description in the sidebar form
2. Click "Add Task" to create a new task card
3. Drag and drop the task card into one of the four quadrants:
   - Q1 (Important + Urgent): Do it right away
   - Q2 (Important + Not Urgent): Plan to do it later
   - Q3 (Not Important + Urgent): Ask someone else
   - Q4 (Not Important + Not Urgent): Skip or remove it
4. Toggle between light and dark mode with the moon/sun button
5. Tasks are automatically saved to your browser's local storage

## The Eisenhower Matrix

The Eisenhower Matrix is a productivity framework that helps prioritize tasks by categorizing them based on their urgency and importance. It was named after Dwight D. Eisenhower, the 34th President of the United States.

### Quadrants:

1. **Important and Urgent**: Do it right away
2. **Important but Not Urgent**: Plan to do it later
3. **Not Important but Urgent**: Ask someone else
4. **Not Important and Not Urgent**: Skip or remove it

## Technical Details

- Task data is stored in the browser's localStorage
- Theme preference is preserved between sessions
- Drag and drop functionality uses the HTML5 Drag and Drop API
- The application works offline after initial load

## Running the Project

Simply open the `index.html` file in a web browser or serve it with any static web server. 