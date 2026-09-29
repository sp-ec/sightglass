
<div align="center">

  <img width="2560" height="1440" alt="SIGHTGLASS LOGO" src="https://github.com/user-attachments/assets/c5a6326b-3cc6-4340-9c7c-1e40c19f0eb9" />
  
  ### A self-hosted platform for analyzing Steam games.

  [![Version](https://img.shields.io/github/v/release/sp-ec/sightglass?include_prereleases&style=flat-square&logo=github)](https://github.com/sp-ec/sightglass/releases)
  [![Last Commit](https://img.shields.io/github/last-commit/sp-ec/sightglass?style=flat-square&logo=git)](https://github.com/sp-ec/sightglass/commits/main)
  [![Stars](https://img.shields.io/github/stars/sp-ec/sightglass?style=flat-square&logo=github)](https://github.com/sp-ec/sightglass/stargazers)

</div>

Sightglass is a self-hosted platform for analyzing over 150,000 Steam games & demos. Own data for game reviews, tags, estimated revenue, languages, release dates, and more. Built for developers, publishers, and marketers who need high customizability and efficiency.

## Features
- **🌐 Steam Database Scraper**
    - Collects extensive data on every Steam game in under 15 minutes.
- **📊 Sophisticated Charting**
    - Create Bar, Scatterplot, Pie & Radar charts.
    - Bucket & filter games by tag, price, release date, etc.
    - Customize how many tags to consider.
    - Aggregate games using median or average.
- **💰 Configurable Revenue Estimates**
    - Estimate revenue with a configurable Boxleiter formula.
    - Add custom tag multipliers and banding estimates.
- **🎮 Individual Game Data**
    - Search for individual games and see revenue estimates, assets, reviews, and more.
- **👥 User Management**
    - Manage multiple users on the platform, enable/disable registration.
 
## Quick Start

Sightglass is quick to deploy, you only need a PostgreSQL server and Docker. Choose one of these options:

### Railway (One-Click)

Click the button below to deploy Sightglass on Railway. Once deployed, just create your admin account.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/sightglass?referralCode=YWPZ1R&utm_medium=integration&utm_source=template&utm_campaign=generic)

### Docker Deployment (Self-Hosted)

Deploy Sightglass yourself by running `docker compose` in the root directory, which will build the images manually and deploy them together.

The official image is available as `spec88/sightglass` on Docker Hub. The `rolling` tag tracks pre-releases.

## Screenshots

<table>
  <tr>
    <td width="50%" align="center">
      <img src="https://github.com/user-attachments/assets/549f5beb-8bc7-4f36-9a9f-307cdc0b0a06" alt="Game List" width="100%" />
      <br /><sub><b>Game List</b></sub>
    </td>
    <td width="50%" align="center">
      <img src="https://github.com/user-attachments/assets/265efc04-3a1b-459f-be6c-f19bc80ad041" alt="Chart Creator" width="100%" />
      <br /><sub><b>Chart Creator</b></sub>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="https://github.com/user-attachments/assets/da16f157-b649-481c-8d97-d4d0b074ab1c" alt="Game Info (1)" width="100%" />
      <br /><sub><b>Game Info</b></sub>
    </td>
    <td width="50%" align="center">
      <img src="https://github.com/user-attachments/assets/ba14a266-92b8-4aed-a319-396a20b03148" alt="Game Info (2)" width="100%" />
      <br /><sub><b>Game Assets</b></sub>
    </td>
  </tr>
</table>

## Disclaimer

Sightglass is not affiliated with Valve or Steam. It is an external tool, using Steam's public API to analyze data.
