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

