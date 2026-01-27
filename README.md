<p align="center">
  <h1 align="center">🏥 LingapLink</h1>
  <p align="center">
    <strong>A HIPAA-Compliant Healthcare Management Platform</strong>
  </p>
  <p align="center">
    Secure, modern healthcare platform with AI-powered triage, end-to-end encryption, and comprehensive patient management.
  </p>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## ✨ Features

### 🔐 Security & Compliance
- **HIPAA Compliant** - Full compliance with healthcare data protection standards
- **AES-256-GCM Encryption** - Military-grade end-to-end encryption for all sensitive data
- **Role-Based Access Control (RBAC)** - Granular permission management
- **Audit Logging** - Complete trail of all data access and modifications
- **Session Management** - Secure session handling with automatic timeouts

### 🏥 Healthcare Features
- **Patient Portal** - Secure access to medical records and appointments
- **Partner Dashboard** - Healthcare provider management interface
- **AI-Powered Triage** - Intelligent symptom assessment using Google's Gemini AI
- **Appointment Management** - Quick scheduling and calendar integration
- **Consent Management** - Digital patient consent workflows

### 🛠️ Technical Features
- **Real-time Updates** - Firebase Firestore for live data synchronization
- **Responsive Design** - Mobile-first approach for all devices
- **Performance Optimized** - Virtual scrolling and lazy loading
- **Type Safety** - Full TypeScript implementation

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | CSS Modules, PostCSS, Autoprefixer |
| **Backend** | Node.js, Express |
| **Database** | Firebase Firestore, PocketBase |
| **Authentication** | Firebase Auth, JWT |
| **AI/ML** | Google Gemini AI |
| **Security** | AES-256-GCM, Helmet, Express Rate Limiter |
| **Testing** | Vitest, React Testing Library |
| **Deployment** | Vercel, Firebase Hosting |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Firebase CLI** (optional, for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/carmen-para-sight.git
   cd carmen-para-sight
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run test` | Run tests |
| `npm run test:ui` | Run tests with UI |
| `npm run test:coverage` | Generate coverage report |
| `npm run type-check` | TypeScript type checking |

---

## 📁 Project Structure

```
carmen-para-sight/
├── .github/                    # GitHub configuration
│   ├── ISSUE_TEMPLATE/         # Issue templates
│   └── workflows/              # CI/CD workflows
├── api/                        # Express backend API
│   └── index.js                # API entry point
├── docs/                       # Documentation
│   ├── ENCRYPTION_DEMO_GUIDE.md
│   └── API.md
├── public/                     # Static assets
├── src/
│   ├── assets/                 # Images and static files
│   ├── components/             # React components
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── LandingPage.tsx     # Landing page
│   │   ├── PatientPortal.tsx   # Patient interface
│   │   └── ...
│   ├── config/                 # Configuration files
│   │   ├── firebase.ts         # Firebase config
│   │   └── security.js         # Security settings
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx     # Authentication context
│   ├── services/               # Business logic & API calls
│   │   ├── auth-service.js     # Authentication service
│   │   ├── encryption.service.ts
│   │   ├── hipaa-compliance.service.ts
│   │   └── ...
│   ├── styles/                 # CSS stylesheets
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   ├── App.tsx                 # Main App component
│   └── main.tsx                # Application entry point
├── .env.example                # Environment variables template
├── package.json                # Project dependencies
├── tsconfig.json               # TypeScript configuration
├── vite.config.js              # Vite configuration
└── vitest.config.ts            # Vitest configuration
```

---

## 📖 Documentation

- [Encryption Demo Guide](docs/ENCRYPTION_DEMO_GUIDE.md) - Learn about our end-to-end encryption implementation
- [API Documentation](docs/API.md) - Backend API reference
- [Security Architecture](docs/SECURITY_ARCHITECTURE.md) - Security design documentation
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions

---

## 🔒 Security

Security is our top priority. This platform implements:

- **Data Encryption** - All sensitive data encrypted at rest and in transit
- **Input Validation** - Comprehensive sanitization against XSS/SQL injection
- **Rate Limiting** - Protection against brute force attacks
- **CSRF Protection** - Token-based cross-site request forgery prevention
- **Content Security Policy** - Strict CSP headers

For security concerns, please see our [Security Policy](SECURITY.md).

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

---

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- Google Gemini AI for powering the triage system
- Firebase for backend infrastructure
- The React and Vite communities

---

<p align="center">
  Made with ❤️ for better healthcare
</p>
