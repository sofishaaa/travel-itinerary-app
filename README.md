# TripPlanner

Android application for planning and managing trips, built with Kotlin and MVVM architecture.

## Features

- Create new trips
- Edit and delete trips
- View trip details
- Track travel budgets
- Statistics screen
- Navigation Drawer navigation
- Local offline storage with Room Database
- Responsive UI with landscape support

## Tech Stack

- Kotlin
- Android SDK
- Room Database
- SQLite
- MVVM
- ViewModel + LiveData
- Kotlin Coroutines
- Material Design Components
- RecyclerView

---

## Screenshots

### Empty State

![Empty State](screenshots/empty-state.png)

### Main Screen

![Main Screen](screenshots/main-screen.png)

### Add Trip Screen

![Add Trip](screenshots/add-trip.png)

### Trip Details

![Trip Details](screenshots/trip-details.png)

### Statistics Screen

![Statistics](screenshots/statistics.png)

### Landscape Orientation Support

![Landscape Mode](screenshots/landscape-mode.png)

---

## Architecture

The application follows the MVVM architecture pattern:

- **Model** — Room entities, DAO, Repository
- **View** — Activities and XML layouts
- **ViewModel** — UI state management and business logic

---

## Implemented Functionality

- CRUD operations for trips
- RecyclerView list rendering
- LiveData observation
- Room persistence layer
- Navigation Drawer
- Form validation
- Statistics calculations
- Empty state handling
- Adaptive layouts

---
