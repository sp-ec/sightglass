# Steam Analyzer

> This is a data and market analysis tool for Steam games. It fetches data from various steam endpoints, and stores them for analysis.

## Tech Stack

- **Framework**: [Next.js, Express, React, shadcn.ui]
- **Database**: [PostgreSQL]
- **Language**: [Typescript]

## Architecture

This project is broken into a server-client architecture. The server fetches data from Steam, manages database interaction, and provides data analysis and queries.

### Client

### Server

The server structure is broken into a localized format. Files that reference each other frequently should be put in the same folder. Functionality is broken into Routes, Controllers, Services, and Repositories. 

- Route files are extremely minimal and only route URL destinations to controller logic. 
- Controller files handle HTTP responses and call service logic. 
- Service files fetch from other APIs, format and analyze data, and communicate with repositories. 
- Repository files handle SQL and database logic.

## Development Guidelines

### Do
- Keep functions small and focused
- Comment code only when necessary and be concise. Comments should always be above the code it is referring to.
- Always read files before editing them, to make sure you have the latest version.
- Read adjacent or similar files to understand code patterns before writing new functionalities.
- Use absolute (top-down) file references such as "@/modules/gameList/titles/gameListTitleService"

### Don't 
- Add dependencies without good reason
- Skip error handling
- Use `any` type
- Leave console.logs in production code