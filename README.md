# EduManage - School Student Management System

A full-stack web application for managing students, attendance, and academic results.

## Features

- **Secure Authentication**: Role-based login for Admins and Students.
- **Admin Dashboard**:
  - Manage student profiles (Add, Edit, Delete).
  - Mark daily attendance (Present/Absent).
  - Upload and update academic results.
  - Export student lists as PDF.
  - Search and filter students by name or class.
- **Student Dashboard**:
  - View personal profile details.
  - Track attendance percentage.
  - View academic results and teacher remarks.
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend**: Firebase Authentication, Firestore Database.
- **Libraries**: Lucide React (Icons), Date-fns (Date handling), jsPDF (PDF Export), Sonner (Notifications).

## Setup Guide

1. **Firebase Configuration**:
   - The app uses Firebase for authentication and database.
   - Configuration is stored in `firebase-applet-config.json`.
   - Security rules are defined in `firestore.rules`.

2. **Admin Setup**:
   - The default administrator is set to: `aaravkumar6428@gmail.com`.
   - Log in with this email to access the Admin Dashboard.

3. **Adding Students**:
   - Go to the "Students" tab in the Admin Dashboard.
   - Click "Add Student" and fill in the details.
   - Note: In this version, user accounts should be created manually in the Firebase Console or linked via the provided email during student creation.

4. **Marking Attendance**:
   - Go to the "Attendance" tab.
   - Select the date and class.
   - Mark students as Present (P) or Absent (A).

## Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```
2. **Deploy to Firebase**:
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login: `firebase login`
   - Initialize: `firebase init` (Select Hosting and Firestore)
   - Deploy: `firebase deploy`

## Security

- Firestore Security Rules ensure that students can only access their own data.
- Admins have full access to manage the school's data.
- All sensitive operations are protected by role-based access control.
