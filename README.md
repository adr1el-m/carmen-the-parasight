# Carmen The ParaSight - AI Healthcare Assistant

An intelligent React-based AI chatbot application designed to address surgical wait times and scheduling inefficiencies in the Philippine healthcare system. Powered by Google's Gemini AI and Firebase, Carmen assists healthcare providers with surgical scheduling optimization, wait-time analytics, and patient coordination.

## Healthcare Problem Statement

Long surgical wait times are a persistent challenge in the Philippine healthcare system, particularly for elective gynecologic procedures in tertiary hospitals. Studies show that the median waiting time for elective gynecologic surgeries in Philippine tertiary training hospitals is 154 days - significantly exceeding global standards. 

Patients requiring urgent attention, such as those with malignancy considerations, often face prolonged delays due to:
- Inefficiencies in scheduling systems
- Diagnostic study wait times
- Ineffective referral processes
- Lack of real-time prioritization tools
- Poor coordination between healthcare providers

## Solution Overview

Carmen The ParaSight addresses these critical healthcare challenges through AI-powered solutions:

### 🏥 **Sub-Case A: Dynamic Surgery Prioritization**
- **Problem**: Hospitals struggle to develop systems that dynamically re-prioritize surgeries based on urgency, patient condition, and hospital capacity
- **Solution**: AI-powered triage and prioritization algorithms that adapt to real-time hospital data

### 🔄 **Sub-Case B: OR Scheduling Optimization**
- **Problem**: Operating rooms and medical staff are underutilized due to poor demand prediction
- **Solution**: Predictive analytics for hospital resource allocation and optimized OR scheduling

### 🌐 **Sub-Case C: Rural Healthcare Access**
- **Problem**: Rural patients travel long distances only to find appointments unavailable
- **Solution**: Adaptive scheduling platform integrating telemedicine and rural outreach programs

## Features

- 🤖 **AI-Powered Healthcare Assistant** using Google Gemini for intelligent conversations
- 📊 **Surgical Wait-Time Analytics** and reporting
- 🏥 **Dynamic Surgery Prioritization** based on medical urgency
- 📅 **Smart Scheduling System** for optimal resource allocation
- 🌍 **Rural Patient Support** with telemedicine integration
- 🔥 **Firebase Integration** for real-time data management
- 💬 **Interactive Chat Interface** for healthcare providers
- 📱 **Responsive Design** for mobile and desktop use
- ⚡ **Real-time Updates** and notifications

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **AI**: Google Gemini (Generative AI) for healthcare decision support
- **Backend**: Firebase for real-time healthcare data management
- **Styling**: CSS3 with healthcare-focused design principles
- **Linting**: ESLint with TypeScript support

## Healthcare Use Cases

### For Healthcare Administrators
- Monitor surgical wait times across departments
- Optimize OR scheduling and resource allocation
- Generate reports on surgical efficiency metrics
- Coordinate patient referrals between hospitals

### For Medical Staff
- Access patient prioritization recommendations
- Receive real-time updates on schedule changes
- Coordinate with other departments seamlessly
- Access telemedicine consultation tools

### For Rural Healthcare Providers
- Connect with specialist consultations
- Schedule patient referrals efficiently
- Access remote diagnostic support
- Coordinate patient transportation needs

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Gemini AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Healthcare API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_HOSPITAL_SYSTEM_ID=your_hospital_system_id
```

### 3. Get API Keys

#### Gemini AI API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `VITE_GEMINI_API_KEY`

#### Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project for your healthcare system
3. Go to Project Settings > General > Your apps
4. Add a web app and copy the configuration
5. Add the configuration values to your `.env` file

### 4. Run the Application

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/
│   └── Chatbot.tsx              # Main healthcare chatbot component
├── config/
│   └── firebase.ts              # Firebase healthcare database configuration
├── services/
│   └── geminiService.ts         # Gemini AI service for healthcare decisions
├── App.tsx                      # Main healthcare app component
├── main.tsx                     # Entry point
└── App.css                      # Healthcare-focused styling
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Usage

1. Start the development server with `npm run dev`
2. Open your browser to `http://localhost:5173`
3. Start consulting with Carmen about surgical scheduling and healthcare optimization!

## Healthcare Features Overview

### AI Healthcare Assistant
- Specialized in surgical scheduling optimization
- Real-time patient prioritization recommendations
- Integration with hospital management systems
- Support for medical decision-making processes

### Surgical Wait-Time Management
- Analytics dashboard for wait-time monitoring
- Predictive modeling for surgery scheduling
- Priority-based patient queue management
- Resource utilization optimization

### Rural Healthcare Integration
- Telemedicine consultation scheduling
- Remote patient monitoring support
- Inter-hospital referral coordination
- Mobile-friendly interface for field use

### Data Security & Compliance
- HIPAA-compliant data handling (when configured)
- Secure patient information management
- Encrypted communication channels
- Audit trails for healthcare decisions

## Contributing to Healthcare Innovation

This project aims to revolutionize healthcare delivery in the Philippines. We welcome contributions from:

- Healthcare professionals with domain expertise
- Software developers interested in health tech
- Data scientists working on predictive healthcare models
- UI/UX designers focused on healthcare accessibility

### Development Guidelines

1. Fork the repository
2. Create a feature branch focused on specific healthcare use cases
3. Ensure compliance with healthcare data privacy standards
4. Test with realistic healthcare scenarios
5. Submit a pull request with detailed healthcare impact analysis

## Future Healthcare Enhancements

- Integration with Hospital Information Systems (HIS)
- Machine learning models for surgical outcome prediction
- Mobile app for healthcare providers
- Multi-language support for diverse patient populations
- Integration with national healthcare databases

## Research & Citations

This project is based on research highlighting the critical need for improved surgical scheduling in Philippine healthcare systems, including studies on:
- Median waiting times for elective gynecologic surgeries (154 days)
- Healthcare resource optimization strategies
- Technology-driven solutions for patient care coordination

## License

MIT License - This healthcare innovation project is open-source to benefit the broader medical community.

## Support & Healthcare Community

For healthcare-related questions, implementation support, or collaboration opportunities:
- Open an issue on the repository
- Contact our healthcare innovation team
- Join our community of healthcare technologists

---

*Together, we can transform healthcare delivery and reduce surgical wait times across the Philippines.*
