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

---

<h2>🏥 Carmen Para-Sight</h2>

**Carmen Para-Sight** is a comprehensive healthcare platform designed to bridge the communication gap between healthcare providers and patients, particularly focusing on speech therapy and rehabilitation services.

### 🌟 Key Features

- **Patient Portal**: Secure patient dashboard with appointment management and medical records
- **Healthcare Provider Interface**: Tools for doctors, therapists, and clinic staff
- **Google Authentication**: Seamless and secure sign-in process
- **Multi-language Support**: English and Filipino (Tagalog) language options
- **Enterprise Security**: CSRF protection, session management, and secure error handling
- **Real-time Communication**: Video consultations and messaging capabilities

### 🔐 Security Features

- **Session Token Security**: Sensitive data stored in memory, not localStorage
- **CSRF Protection**: Comprehensive protection against cross-site request forgery
- **Rate Limiting**: Multi-tier rate limiting for different endpoint types
- **Error Message Sanitization**: Prevents information leakage in production
- **Input Validation**: XSS protection and sanitization

### 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with Google OAuth
- **Security**: Helmet, CORS, express-rate-limit, CSRF tokens
- **AI Integration**: Google Gemini API for enhanced healthcare insights

### 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/adr1el-m/carmen-the-parasight.git
   cd carmen-para-sight
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.template .env
   # Edit .env with your Firebase and API credentials
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Access the application**
   - Patient Portal: `http://localhost:3000/public/patientPortal.html`
   - Sign In: `http://localhost:3000/public/patientSign-in.html`

### 📚 Documentation

- [Session Token Security Fix](SESSION_TOKEN_SECURITY_FIX.md)
- [CSRF Protection Implementation](CSRF_PROTECTION_SECURITY_FIX.md)
- [Error Message Security](ERROR_MESSAGE_SECURITY_FIX.md)
- [Rate Limiting Configuration](RATE_LIMITING_SECURITY_FIX.md)
- [Firestore Rules Setup](FIRESTORE_RULES_FIX.md)

### 🤝 Contributing

We welcome contributions! Please read our contributing guidelines and submit pull requests for any improvements.

### 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

### 🆘 Support

For support or questions, please contact our development team through the LinkedIn profiles above or create an issue in this repository.