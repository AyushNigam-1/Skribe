# Skribe

Skribe is a modern, collaborative writing and storytelling platform designed to help authors create, share, and co-write draft in real-time. It features a robust contribution system, fine-grained access controls, and a highly responsive, animated user interface.

## ✨ Features

The platform is built around a seamless reading and writing experience, divided into the following core areas:

### ✍️ Core Writing & Exploration
* **Draft Creation & Management:** Easily create new drafts and draft with intuitive tools.
* **Explore & Discovery:** A rich exploration feed featuring advanced search and filtering capabilities to find specific drafts and genres.
* **Zen Mode:** A distraction-free writing and reading environment for deep focus.
* **Draft Details Page:** Dedicated pages for each draft showcasing metadata, statistics, and content.

### 🤝 Collaboration & Contributions
* **Contribution System:** Users can propose changes or additions to a draft. Authors have full control to review, approve, or reject these requests.
* **Discussion Panels:** Dedicated, real-time chat interfaces attached to specific contributions to facilitate focused discussions.
* **Contributor Management:** View detailed contributor pages and track individual user contributions through the "My Contributions" dashboard.

### 🛡️ Workspace Management & Roles
* **Access Control & Visibility:** Set drafts to Public, Private, or Unlisted.
* **Member Roles & Invitations:** Invite users to collaborate and assign specific roles.
* **Moderation:** Authors can actively manage their workspaces by kicking members if necessary.
* **Danger Zone:** Secure options for authors to clear all draft content, remove all members at once, or permanently delete a draft.

### 💬 Social & Real-Time Engagement
* **Live Notifications:** Real-time push notifications powered by WebSockets (Socket.io) for invites, approvals, and interactions.
* **Interactions:** Bookmark favorite drafts, and upvote/downvote both draft and individual contributions.
* **Dynamic User Profiles:** Customizable profiles that track total profile views and user likes.

### 🔐 Security & Authentication
* **Secure Authentication:** Robust login systems including a secure password reset flow.

---

## 🛠️ Tech Stack

This project is built using a modern, scalable full-stack architecture, prioritizing performance, security, and developer experience.

### Frontend
* **Core:** React, Apollo Client (GraphQL Data Fetching)
* **State Management:** Zustand
* **Forms & Validation:** React Hook Form, Zod
* **Styling & UI:** Tailwind CSS, Headless UI
* **Animations:** Framer Motion

### Backend
* **Core:** Node.js, Express.js, GraphQL (Apollo Server)
* **Real-Time:** Socket.io (WebSocket connections)
* **Security & Middleware:** Helmet (HTTP Security Headers), Express middleware
* **Rate Limiting:** Custom GraphQL rate limiter backed by Redis

### Database & Caching
* **Database:** MongoDB, Mongoose (ODM)
* **Caching:** Redis

### Auth, Analytics & Monitoring
* **Authentication:** Better Auth
* **Product Analytics:** PostHog
* **Error Tracking:** Sentry