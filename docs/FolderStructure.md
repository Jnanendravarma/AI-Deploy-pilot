# Complete Repository Folder Structure

The application is structured into a clean monorepo division.

```
DeployPilot-AI/
│
├── frontend/             # React + Vite client dashboard
│   ├── public/           # Static assets, icons, manifest
│   ├── src/
│   │   ├── app/          # Initializers, router, global providers
│   │   ├── components/   # UI elements (Card, Button, Terminal, etc.)
│   │   ├── pages/        # Dashboard view screens (Landing, Login, Settings, etc.)
│   │   ├── context/      # Global state providers and context hooks
│   │   └── services/     # REST API wrappers
│
├── backend/              # Node + Express REST & WebSocket server
│   ├── src/
│   │   ├── config/       # Databases and environment connections
│   │   ├── controllers/  # API request-response handlers
│   │   ├── routes/       # Endpoint routing tables
│   │   ├── models/       # Mongoose schemas definitions
│   │   ├── services/     # Core logic and worker drivers
│   │   └── doctor/       # AI diagnostic rules classifier
│
├── docs/                 # System architecture guides and API specs
├── docker/               # Container configs and production configs
└── scripts/              # Development environment scripts
```
