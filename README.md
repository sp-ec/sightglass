

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

<img width="1920" height="917" alt="sightglass-1" src="https://github.com/user-attachments/assets/779a5f6f-c42a-4213-b09e-5e8bf8bacda6" />
<img width="1920" height="917" alt="sightglass-3" src="https://github.com/user-attachments/assets/5b323093-a6ef-4ecb-9ae5-31aea1f6f4dd" />
<img width="1902" height="915" alt="sightglass-2" src="https://github.com/user-attachments/assets/da9a64cc-3bf7-4fee-87b8-a4c4dfa1fdb4" />
<img width="1920" height="917" alt="sightglass-4" src="https://github.com/user-attachments/assets/4a99469a-b7f8-4169-ac9b-da7a5f43d088" />


## Disclaimer

Sightglass is not affiliated with Valve or Steam. It is an external tool, using Steam's public API to analyze data.
