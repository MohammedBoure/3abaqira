# Parent Notes & Communication Center (`frontend/src/components/dashboard/communication/`)

## Overview
This directory implements the central communication suite for Genius Kids Academy according to `docs/genius_kids_academy_report.txt` and `.agent/agy52.md`.
It encapsulates two-way administrative parent notes, dynamic administrative time-window governance, and an outbound multi-channel notification queue monitor (SMS, WhatsApp Business API, Telegram Bot, SMTP Relay).

## Component Breakdown & Responsibilities

| Component | Responsibility | Props & State Models | Contracts & Key Enforcements |
| :--- | :--- | :--- | :--- |
| `CommunicationCenterView.jsx` | Master communication container providing high-density tabbed switching between Parent Notes and Notification Queue. | `initialTab`: string (`notes`, `queue`). | Unified communication hub for administrative receptionists and head office staff. |
| `ParentNotesThreadView.jsx` | Two-way parent notes thread with administrative time-window governance and staff response handling. | State: `notes`, `policy`, `selectedNote`, `replyText`, `searchQuery`, `statusFilter`. | Staff Answer Once Policy: staff can only reply once to close the thread; Admin Window Policy: allows administration to restrict note submission to active working hours (e.g., 08:00-17:00). |
| `NotificationQueueMonitorView.jsx` | Real-time outbound notification queue monitor across SMS, WhatsApp, Telegram, and Email. | State: `queue`, `channelFilter`, `statusFilter`, `searchQuery`. | Consolidated queue routing: absence alerts, payment receipts, monthly report approvals, interview invitations. Provides failed delivery re-try actions and gateway telemetry. |

## Integration Notes
- **Outbound Gateway Endpoints:** Mobilis/Algeria Telecom Bulk SMS, WhatsApp Cloud API, Telegram Bot API (`@GeniusKidsBot`), and Genius Postal SMTP.
- **Privacy Standard:** Parent phone numbers and correspondence logs adhere to Algerian Law 18-07 privacy constraints.
