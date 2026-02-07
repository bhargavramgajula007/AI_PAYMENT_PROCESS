# AI-Powered Payments Approval & Fraud Intelligence

A real-time fraud detection and payments approval system built for the hackathon.

## 🚀 Quick Start in 1 Step

1. **Run the System**:
   ```bash
   npm run start
   ```
   This will launch:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3000
   - **Simulation Engine**: Auto-starts generating transactions

## 🔑 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Officer** | `officer` | `officer123` |
| **Investigator** | `investigator` | `investigator123` |

## 🌟 Key Features to Demo

1. **Real-Time Queue**: Watch `Queue View` for live transactions streaming from the PaySim simulation.
2. **Fraud Injection**: The system auto-generates normal traffic, but you can inject ring patterns.
3. **Graph Visualization**: Go to `Fraud Rings` to see the D3 force-directed graph of suspicious networks.
4. **AI Explainer**: Click any case to see the `Gemini` generated explanation of why it was flagged.
5. **Investigator Copilot**: Use natural language to query the database (e.g., "Find high risk transfers").

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind (Monochrome Theme), D3.js
- **Backend**: Express.js, SSE (Server-Sent Events)
- **AI**: Google Gemini (via `@google/generative-ai`)
- **Data**: Real-time simulation based on **PaySim** dataset statistics.
