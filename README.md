<h1 align="center">
     🏅 Olympia Website ~ Modern responsive Dashboard
</h1>

<p align="center">
  <i align="center">This project is a sample application showing how Olympic tournament data could be presented attractively. Inspired by the design of the official Olympic Games - we are not affiliated with Olympics.com. </i>
  <br /><br />
  <img src="https://i.imgur.com/ATGTpQA.png" alt="Showcase img" />
<br />

<h4 align="center">
  <a href="https://angular.dev">
    <img src="https://img.shields.io/badge/Angular-20.3.16-27ae60?style=for-the-badge" alt="angular version" style="height: 25px;">
  </a>
  <a href="https://tailwindcss.com">
    <img src="https://img.shields.io/badge/Tailwind-4.1.18-27ae60?style=for-the-badge" alt="tailwind version" style="height: 25px;">
  </a>
  <a href="https://jestjs.io/">
    <img src="https://img.shields.io/badge/JEST-30.2.0-27ae60?style=for-the-badge" alt="jest version" style="height: 25px;">
  </a>
  <br>
</h4>

## 📑 Table of Contents
- [🗯️ Introduction](#%EF%B8%8F-introduction)
- [🪛 Features](#-features)
- [🔨 How can I run the project?](#-how-can-i-run-the-project)
  - [Requirements](#requirements)
  - [Start the project](#start-the-project)
- [📚 User Guide for Competition Judges](#-user-guide-for-competition-judges)
  - [1. Create an Account](#1-create-an-account)
  - [2. Select the View You Want to Edit](#2-select-the-view-you-want-to-edit-athletes-countries-or-discipline-results)
  - [3. Edit Data](#3-edit-data)

<hr>

## 🗯️ Introduction
› This project provides a modern and user-friendly alternative to the Olympic Games website. The design is heavily based on the original and was created as part of an assignment during training as an IT specialist for application development.

💝 › The project was developed by Yannic Drews, Yanic Doepner, and Nils Sievers and it is not affiliated with the Olympic Games. It is only a “fan-made” project and is intended for learning purposes.
## 🪛 Features
› The project implemented all features that were required within the scope of the requirements specification and functional specification. These include the following features:
<ul>
  <li>🏅 <strong>Sports Results Overview</strong>: Visitors can browse competition results organized by sport. Each entry displays the athlete’s name, the represented country, and the recorded performance.</li>
  <br />
  <li>🥇 <strong>Medal Visualization</strong>: Medal wins are clearly indicated with visual icons so users can instantly recognize gold, silver, and bronze achievements.</li>
  <br />
  <li>🌍 <strong>Country-Based Results View</strong>: Users can explore results by country through a graphical country overview and view both the medal table and all athlete performances of a selected nation.</li>
  <br />
  <li>📊 <strong>Medal Table & Statistics</strong>: The website provides visualized competition statistics such as medal counts, nation comparisons, and an overview of medals achieved by each country.</li>
  <br />
  <li>🔐 <strong>Secure Judge Login</strong>: Competition judges have access to a protected login area where they can authenticate using a username and password.</li>
  <br />
  <li>✏️ <strong>Result Management</strong>: Authenticated judges can add, edit, or delete competition results for supported winter sports disciplines.</li>
  <br />
  <li>🗄️ <strong>MySQL Database Storage</strong>: All competition data and results are stored securely in a MySQL database to ensure reliable and structured data management.</li>
  <br />
  <li>⚡ <strong>Real-Time Result Updates</strong>: Changes made by judges are immediately reflected on the public website so visitors always see the latest results.</li>
  <br />
  <li>📥 <strong>Excel Data Import</strong>: The backend supports importing data from Excel files, allowing judges to load initial data sets or update existing results efficiently.</li>
  <br />
  <li>📱 <strong>Responsive Design</strong>: The website is optimized for different screen sizes and works smoothly on desktops, tablets, and smartphones.</li>
  <br />
  <li>🌐 <strong>Multilingual Support</strong>: The platform supports multiple languages (including German, French and English) and allows users to switch languages at any time.</li>
  <br />
  <li>🛡️ <strong>GDPR Compliance</strong>: The website follows GDPR requirements by including a cookie banner and proper handling of user data.</li>
  <br />
  <li>✅ <strong>100% Unit-Test Coverage</strong>: The application is protected by comprehensive automated tests, with unit tests achieving full coverage to ensure reliability and maintainability.</li>
</ul>

⚙️ › To run the <strong>test coverage</strong> and see the results, just open a terminal in the project root folder and run the command `jest`.

## 🔨 How can i run the project?
### Requirements
› You need to have <strong><a href="https://www.docker.com/products/docker-desktop/" target="_blank">Docker Desktop</a></strong> installed and started.

### Start the project
1. Clone the repository by using `git clone https://github.com/deinname/olympia-website-new.git`
2. Switch to the correct folder: `cd olympia-website-new`
3. Run `docker compose up --build` and wait a few minutes.
   - You will probaly see a `Unknown Error`, but you can ignore it - docker will continue anyway.
4. Run the Backend REST-API (More Details <strong><a href="https://github.com/yannic-md/olympia-website-api/blob/main/README.md#-how-can-i-use-the-project" target="_blank">here</a></strong>)
5. Visit the page in your browser: https://localhost:4000

## 📚 User Guide for Competition Judges
› Competition judges can log in or register on this website to create, edit, or delete tournament data (athletes, countries, or competition results). Alternatively, an Excel import is also available.

### 1. Create an Account
Go to <a href="http://localhost:4000/login" target="_blank">http://localhost:4000/login</a> and create an account by clicking the text below the input fields. A modal will open where you can choose a username and set a password. After that, you will be automatically logged in and redirected to the homepage.

### 2. Select the View You Want to Edit (Athletes, Countries, or Discipline Results)
On the subpage <a href="http://localhost:4000/detailed" target="_blank">http://localhost:4000/detailed</a>, you will find a comprehensive overview of competition results. Here you can use the respective buttons to add, update, or delete entries.

Using the **“Filter & Search”** box above, you can switch the view in the **“View”** dropdown to **“Athletes”** or **“Countries.”**

### 3. Edit Data
When you click an action button, a modal will open where the data for a country, athlete, or competition result can be edited. The data is automatically validated and then sent to the backend, and the corresponding list is dynamically updated.

