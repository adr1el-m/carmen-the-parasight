# Vercel Deployment Guide for Carmen the Parasight

## 🚀 Deployment Status: READY ✅

Your project is now configured for Vercel deployment! Here's what you need to do:

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab Repository**: Your code should be in a Git repository
3. **Environment Variables**: Configure the required environment variables

## 🔧 Environment Variables Setup

### Required Environment Variables in Vercel Dashboard:

#### Firebase Configuration (Client-Side)
```
VITE_FIREBASE_API_KEY=your_actual_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_messaging_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_actual_measurement_id
```

#### Google Gemini AI
```
VITE_GEMINI_API_KEY=your_actual_gemini_api_key
```

#### Application Settings
```
VITE_APP_NAME=LingapLink
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
VITE_API_URL=https://your-vercel-domain.vercel.app
```

#### Security (Server-Side)
```
JWT_SECRET=your_secure_jwt_secret_min_32_chars
JWT_ISSUER=lingaplink-healthcare
JWT_AUDIENCE=lingaplink-users
CSRF_SECRET=your_secure_csrf_secret_min_32_chars
SESSION_SECRET=your_secure_session_secret_min_32_chars
```

#### Firebase Admin (Server-Side)
```
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_actual_private_key\n-----END PRIVATE KEY-----"
```

## 🚀 Deployment Steps

### 1. Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Select the repository

### 2. Configure Project
- **Framework Preset**: Vite
- **Root Directory**: `./` (root of your project)
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Environment Variables
1. In your Vercel project dashboard
2. Go to "Settings" → "Environment Variables"
3. Add all the environment variables listed above
4. Make sure to set the correct environment (Production, Preview, Development)

### 4. Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at `https://your-project.vercel.app`

## 🔍 Build Configuration

Your project is configured with:

- **Frontend**: Vite + React + TypeScript
- **API**: Express.js serverless functions
- **Build Output**: `dist/` folder
- **Vercel Build**: `@vercel/static-build` for frontend, `@vercel/node` for API

## ⚠️ Important Notes

1. **Environment Variables**: Never commit sensitive values to your repository
2. **Firebase Rules**: Ensure your Firebase security rules are properly configured
3. **CORS**: Update CORS origins in your API to include your Vercel domain
4. **API Routes**: Your API will be available at `/api/*` endpoints

## 🧪 Testing Deployment

After deployment:

1. **Frontend**: Visit your Vercel URL
2. **API**: Test `/api/health` endpoint
3. **Authentication**: Test login/signup flows
4. **Firebase**: Verify Firebase connections work

## 🔧 Troubleshooting

### Build Failures
- Check environment variables are set correctly
- Verify all dependencies are in `package.json`
- Check for TypeScript errors locally first

### Runtime Errors
- Check browser console for frontend errors
- Check Vercel function logs for API errors
- Verify Firebase configuration

### Environment Issues
- Ensure all required environment variables are set
- Check that sensitive variables are not exposed to the client

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Configuration](https://vitejs.dev/config/)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

## 🎉 Success!

Once deployed, your healthcare application will be available globally with:
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless API functions
- ✅ Automatic deployments on Git push
- ✅ Environment-specific configurations

Your project is now **Vercel-ready**! 🚀
