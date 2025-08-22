# 🚨 Medical Triage System

This system automatically evaluates the urgency of medical appointments using Google Gemini AI and displays color-coded indicators on appointment cards.

## 🎯 Features

- **AI-Powered Evaluation**: Uses Gemini AI to analyze appointment details
- **Color-Coded Urgency**: Visual indicators for quick triage assessment
- **Smart Caching**: Avoids repeated API calls for similar appointments
- **Fallback System**: Keyword-based evaluation if AI is unavailable
- **Responsive Design**: Works on all device sizes

## 🎨 Color Coding System

### 🔴 RED (CRITICAL)
- **When**: Life-threatening conditions, severe symptoms
- **Action**: Immediate medical attention required
- **Examples**: Chest pain, heart attack symptoms, severe bleeding

### 🟠 ORANGE (VERY URGENT)
- **When**: Serious conditions, moderate to severe symptoms
- **Action**: Attention needed soon
- **Examples**: High fever, severe headache, broken bones

### 🟢 GREEN (ROUTINE)
- **When**: Non-urgent conditions, mild symptoms
- **Action**: Can wait for normal scheduling
- **Examples**: Annual checkups, routine physicals, minor consultations

## 🚀 Setup

### 1. Add Gemini API Key
Add your Google Gemini API key to your `.env` file:

```bash
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

### 2. Get API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key or use an existing one

### 3. Install Dependencies
The required package is already installed:
```bash
npm list @google/generative-ai
```

## 📱 How It Works

### Automatic Evaluation
The system automatically evaluates urgency when:
- Appointments are loaded in the dashboard
- New appointments are added
- Appointment details are modified

### Manual Evaluation
You can manually evaluate urgency using the demo component:
```tsx
import TriageDemo from './components/TriageDemo'

// In your app
<TriageDemo />
```

### API Integration
The system integrates with your existing appointment data:
- **Symptoms**: Patient-reported symptoms
- **Condition**: Medical condition description
- **Notes**: Additional notes or context
- **Type**: Appointment type (checkup, emergency, etc.)

## 🔧 Configuration

### Cache Settings
- **Duration**: 5 minutes (configurable in `triage.service.ts`)
- **Purpose**: Reduces API calls and costs

### AI Model
- **Model**: `gemini-1.5-flash`
- **Optimization**: Fast, cost-effective responses

### Fallback System
If Gemini AI is unavailable, the system uses keyword-based evaluation:
- Predefined critical keywords
- Predefined urgent keywords
- Defaults to routine for unknown cases

## 📊 Usage Examples

### Example 1: Critical Case
```json
{
  "symptoms": "severe chest pain, shortness of breath",
  "condition": "heart attack symptoms",
  "notes": "patient experiencing extreme discomfort"
}
```
**Result**: 🔴 RED - CRITICAL

### Example 2: Urgent Case
```json
{
  "symptoms": "high fever, severe headache",
  "condition": "meningitis symptoms",
  "notes": "patient needs immediate attention"
}
```
**Result**: 🟠 ORANGE - VERY URGENT

### Example 3: Routine Case
```json
{
  "symptoms": "nakagat ng lamok",
  "condition": "Mosquito bite",
  "notes": "meow"
}
```
**Result**: 🟢 GREEN - ROUTINE

## 🎨 Customization

### Colors
Modify colors in `AppointmentCard.tsx`:
```tsx
case 'RED':
  return {
    backgroundColor: '#dc2626',  // Customize this
    color: 'white',
    borderColor: '#dc2626'
  }
```

### Styling
Adjust CSS in `dashboard.css`:
```css
.urgency-indicator {
    width: 16px;        /* Adjust size */
    height: 80px;       /* Adjust height */
    left: -8px;         /* Adjust position */
}
```

### AI Prompt
Customize the AI evaluation prompt in `triage.service.ts`:
```tsx
function createUrgencyPrompt(appointment: AppointmentData): string {
  // Modify this function to change how AI evaluates urgency
}
```

## 🧪 Testing

### Demo Component
Use the `TriageDemo` component to test the system:
1. Import and add to your app
2. Click "Evaluate All Appointments"
3. See color-coded results

### Console Logs
Check browser console for:
- API call logs
- Error messages
- Cache statistics

### Cache Management
```tsx
import { clearUrgencyCache, getCacheStats } from '../services/triage.service'

// Clear cache
clearUrgencyCache()

// Get cache info
console.log(getCacheStats())
```

## ⚠️ Important Notes

### Security
- API key is exposed to client-side (use backend proxy in production)
- Consider rate limiting for production use

### Costs
- Each Gemini API call has a cost
- Caching reduces unnecessary calls
- Monitor usage in Google AI Studio

### Reliability
- System has fallback evaluation
- Gracefully handles API failures
- Defaults to safe (GREEN) when uncertain

## 🚀 Future Enhancements

- **Backend Integration**: Move AI calls to secure backend
- **Machine Learning**: Train custom models for specific medical domains
- **Real-time Updates**: WebSocket integration for live urgency changes
- **Analytics**: Track urgency patterns and trends
- **Multi-language**: Support for different languages in symptoms/notes

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify API key is correct
3. Ensure network connectivity
4. Check Gemini API quotas and limits

---

**Note**: This system is for demonstration and educational purposes. Always consult with medical professionals for actual medical triage decisions.



