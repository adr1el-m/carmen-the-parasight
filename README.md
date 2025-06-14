# Carmen The ParaSight - AI Chatbot

A modern React-based AI chatbot application powered by Google's Gemini AI and Firebase.

## Features

- 🤖 AI-powered conversations using Google Gemini
- 🔥 Firebase integration for data storage and authentication
- 💬 Real-time chat interface
- 📱 Responsive design
- 🎨 Modern and attractive UI
- ⚡ Built with Vite for fast development

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **AI**: Google Gemini (Generative AI)
- **Backend**: Firebase
- **Styling**: CSS3 with modern design principles
- **Linting**: ESLint with TypeScript support

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

# Additional Configuration
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Get API Keys

#### Gemini AI API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `VITE_GEMINI_API_KEY`

#### Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
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
│   └── Chatbot.tsx          # Main chatbot component
├── config/
│   └── firebase.ts          # Firebase configuration
├── services/
│   └── geminiService.ts     # Gemini AI service
├── App.tsx                  # Main app component
├── main.tsx                 # Entry point
└── App.css                  # Styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Usage

1. Start the development server with `npm run dev`
2. Open your browser to `http://localhost:5173`
3. Start chatting with Carmen, your AI assistant!

## Features Overview

### Chatbot Interface
- Clean, modern chat interface
- Real-time message exchange
- Loading states and error handling
- Responsive design for mobile and desktop

### AI Integration
- Powered by Google Gemini Pro model
- Contextual conversations
- Error handling for API failures
- Configurable response parameters

### Firebase Integration
- Ready for user authentication
- Database integration setup
- Real-time data synchronization capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes!

## Support

If you encounter any issues or have questions, please open an issue on the repository.
