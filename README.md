<h2>🛠️ Tech Stack</h2>

<table>
  <tr>
    <td align="center"><strong>Frontend</strong></td>
    <td>
      <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
      <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
      <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
      <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
      <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
      <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    </td>
  </tr>
  <tr>
    <td align="center"><strong>Backend</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
      <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    </td>
  </tr>
  <tr>
    <td align="center"><strong>Database & Auth</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
      <img src="https://img.shields.io/badge/Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firestore" />
    </td>
  </tr>
  <tr>
    <td align="center"><strong>AI & Machine Learning</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Google Gemini" />
      <img src="https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama" />
    </td>
  </tr>
  <tr>
    <td align="center"><strong>Tooling & Deployment</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
      <img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint" />
      <img src="https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black" alt="Prettier" />
      <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
    </td>
  </tr>
</table>

<h2>🚀 How to View LingapLink on Your Browser</h2>

To explore the LingapLink platform locally, you can use the Live Server extension in Visual Studio Code, which provides a simple way to serve the HTML files.

### 1. Clone the Repository

First, clone the repository to your local machine using the following command:

```bash
git clone https://github.com/adr1el-m/carmen-the-parasight.git
cd carmen-para-sight
```

### 2. Open in VS Code and Use Live Server

1.  **Open the project** in Visual Studio Code.
2.  **Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension** from the VS Code Marketplace.
3.  Once installed, right-click on any `.html` file within the `public/` directory (e.g., `public/index.html` or `public/patientPortal.html`).
4.  Select **"Open with Live Server"** from the context menu.

This will launch the file in your default web browser with a live-reloading development server.

<h2 id="repository-structure">🗂️ Repository Structure</h2>

The project is organized into modular folders to separate concerns and improve maintainability. The structure is designed to clearly distinguish between public-facing pages, server-side logic, client-side scripts, and shared utilities.

```sh
LingapLink/
├── public/               # All client-facing HTML pages
│   ├── patientSign-in.html
│   ├── patientSign-up.html
│   ├── index.html
│   ├── businessSignIn.html
│   ├── patientPortal.html
│   ├── dashboard.html
│   └── businessRegistration.html
│
├── src/
│   ├── assets/           # Images, icons, and other static assets
│   │   └── img/
│   ├── config/           # Configuration files (e.g., Firebase)
│   │   └── firebase.ts
│   ├── pages/            # Page-specific JavaScript modules
│   │   ├── index.js
│   │   ├── dashboard.js
│   │   └── patientPortal.js
│   ├── services/         # Core application services
│   │   ├── auth-service.js
│   │   ├── firestoredb.js
│   │   └── organization-service.js
│   ├── styles/           # CSS stylesheets for each page
│   │   ├── index.css
│   │   ├── dashboard.css
│   │   └── patientPortal.css
│   └── utils/            # Shared utility scripts and helper functions
│       ├── auth-guard.js
│       ├── form-validation.js
│       └── logger.js
│
├── api/                  # Server-side logic and API endpoints
│   └── index.js
├── scripts/              # Build and utility scripts
│   └── verify-env.js
│
├── .env.template         # Environment variable template
├── firestore.rules       # Firebase security rules
├── package.json          # Project dependencies and scripts
└── README.md             # You are here
```

<h2>👨‍💻 Team Details 👨‍💻</h2>

<table align="center" width="100%">
  <!-- First Row: 3 members -->
  <tr>
    <!-- Threshia -->
    <td align="center" width="33.33%">
      <img src="src/assets/img/Threshia.png" alt="Threshia Andre Saut" style="border-radius: 50%; width: 120px; height: 120px;"><br><br>
      <strong>Threshia Andre Saut</strong><br>
      <p align="center">
        <a href="https://www.linkedin.com/in/threshia-saut-b74055316/">
          <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
        </a>
      </p>
    </td>
    <!-- Franchezca -->
    <td align="center" width="33.33%">
      <img src="src/assets/img/Francheska.png" alt="Franchezca Natividad Z. Banayad" style="border-radius: 50%; width: 120px; height: 120px;"><br><br>
      <strong>Franchezca Natividad Z. Banayad</strong><br>
      <p align="center">
        <a href="https://www.linkedin.com/in/franchezca-banayad/">
          <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
        </a>
      </p>
    </td>
    <!-- Juanito -->
    <td align="center" width="33.33%">
      <img src="src/assets/img/juanito.png" alt="Juanito Masam Ramos II" style="border-radius: 50%; width: 120px; height: 120px;"><br><br>
      <strong>Juanito Masam Ramos II</strong><br>
      <p align="center">
        <a href="https://www.linkedin.com/in/juanito-ramos/">
          <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
        </a>
      </p>
    </td>
  </tr>
  
  <!-- Second Row: 2 members centered with empty cells for balance -->
  <tr>
    <td></td>
    <!-- Maxxine -->
    <td align="center" width="33.33%">
      <img src="src/assets/img/max.png" alt="Maxxinne Lorin M. Fernandez" style="border-radius: 50%; width: 120px; height: 120px;"><br><br>
      <strong>Maxxinne Lorin M. Fernandez</strong><br>
      <p align="center">
        <a href="https://www.linkedin.com/in/maxxinne-fernandez-364776336/">
          <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
        </a>
      </p>
    </td>
    <!-- Adriel -->
    <td align="center" width="33.33%">
      <img src="src/assets/img/Adriel.png" alt="Adriel Magsipoc Magalona" style="border-radius: 50%; width: 120px; height: 120px;"><br><br>
      <strong>Adriel Magsipoc Magalona</strong><br>
      <p align="center">
        <a href="https://www.linkedin.com/in/adriel-magalona/">
          <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
        </a>
      </p>
    </td>
  </tr>
</table>

