import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')

// Cache for urgency evaluations to avoid repeated API calls
const urgencyCache = new Map<string, { level: string; urgency: string; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface AppointmentData {
  id?: string
  symptoms?: string
  condition?: string
  notes?: string
  type?: string
  status?: string
  date?: string
  [key: string]: any
}

interface UrgencyResult {
  level: 'RED' | 'ORANGE' | 'GREEN'
  urgency: string
}

/**
 * Evaluates the urgency of an appointment using Gemini AI
 * @param appointment - The appointment data to evaluate
 * @returns Promise<UrgencyResult> - The urgency level and description
 */
export async function evaluateAppointmentUrgency(appointment: AppointmentData): Promise<UrgencyResult> {
  try {
    // Check if API key is configured
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.warn('Gemini API key not configured, using fallback evaluation')
      return fallbackUrgencyEvaluation(appointment)
    }

    // Check cache first
    const cacheKey = generateCacheKey(appointment)
    const cached = urgencyCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached urgency for appointment ${appointment.id}: ${cached.level}`)
      return {
        level: cached.level as 'RED' | 'ORANGE' | 'GREEN',
        urgency: cached.urgency
      }
    }

    console.log(`Evaluating urgency for appointment ${appointment.id} using Gemini AI...`)

    // Prepare the prompt for Gemini AI
    const prompt = createUrgencyPrompt(appointment)
    
    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    // Generate response
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log(`Gemini AI response for appointment ${appointment.id}:`, text)
    
    // Parse the AI response
    const urgency = parseAIResponse(text)
    
    console.log(`Parsed urgency for appointment ${appointment.id}:`, urgency)
    
    // Cache the result
    urgencyCache.set(cacheKey, {
      level: urgency.level,
      urgency: urgency.urgency,
      timestamp: Date.now()
    })
    
    return urgency
  } catch (error) {
    console.error(`Error evaluating appointment ${appointment.id} urgency:`, error)
    
    // Fallback to basic evaluation based on keywords
    const fallback = fallbackUrgencyEvaluation(appointment)
    console.log(`Using fallback evaluation for appointment ${appointment.id}:`, fallback)
    return fallback
  }
}

/**
 * Creates a prompt for Gemini AI to evaluate urgency
 */
function createUrgencyPrompt(appointment: AppointmentData): string {
  const { symptoms = '', condition = '', notes = '', type = '', status = '' } = appointment
  
  return `You are a medical triage AI assistant. Evaluate the urgency of this medical appointment and respond with ONLY a JSON object in this exact format:

{
  "level": "RED|ORANGE|GREEN",
  "urgency": "CRITICAL|VERY URGENT|ROUTINE"
}

Use these criteria:
- RED (CRITICAL): Life-threatening conditions, severe symptoms, immediate medical attention required
- ORANGE (VERY URGENT): Serious conditions, moderate to severe symptoms, attention needed soon
- GREEN (ROUTINE): Non-urgent conditions, mild symptoms, can wait for normal scheduling

Appointment details:
- Symptoms: ${symptoms}
- Condition: ${condition}
- Notes: ${notes}
- Type: ${type}
- Status: ${status}

Consider medical urgency, not scheduling priority. Respond with only the JSON object.`
}

/**
 * Parses the AI response to extract urgency information
 */
function parseAIResponse(response: string): UrgencyResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.level && parsed.urgency) {
        return {
          level: parsed.level.toUpperCase() as 'RED' | 'ORANGE' | 'GREEN',
          urgency: parsed.urgency.toUpperCase()
        }
      }
    }
    
    // Fallback parsing if JSON extraction fails
    const levelMatch = response.match(/(RED|ORANGE|GREEN)/i)
    const urgencyMatch = response.match(/(CRITICAL|VERY URGENT|ROUTINE)/i)
    
    if (levelMatch && urgencyMatch) {
      return {
        level: levelMatch[1].toUpperCase() as 'RED' | 'ORANGE' | 'GREEN',
        urgency: urgencyMatch[1].toUpperCase()
      }
    }
    
    throw new Error('Could not parse AI response')
  } catch (error) {
    console.warn('Failed to parse AI response, using fallback:', error)
    return {
      level: 'GREEN',
      urgency: 'ROUTINE'
    }
  }
}

/**
 * Fallback urgency evaluation based on keyword analysis
 */
function fallbackUrgencyEvaluation(appointment: AppointmentData): UrgencyResult {
  const { symptoms = '', condition = '', notes = '', type = '' } = appointment
  const text = `${symptoms} ${condition} ${notes} ${type}`.toLowerCase()
  
  // Critical/Red indicators
  const redKeywords = [
    'chest pain', 'heart attack', 'stroke', 'severe bleeding', 'unconscious',
    'difficulty breathing', 'severe trauma', 'overdose', 'suicide', 'seizure',
    'cardiac arrest', 'respiratory failure', 'anaphylaxis', 'severe burns'
  ]
  
  // Urgent/Orange indicators
  const orangeKeywords = [
    'high fever', 'severe headache', 'broken bone', 'deep cut', 'infection',
    'dehydration', 'severe pain', 'allergic reaction', 'meningitis symptoms',
    'appendicitis', 'gallbladder', 'kidney stone', 'pneumonia symptoms'
  ]
  
  // Check for red level
  if (redKeywords.some(keyword => text.includes(keyword))) {
    return { level: 'RED', urgency: 'CRITICAL' }
  }
  
  // Check for orange level
  if (orangeKeywords.some(keyword => text.includes(keyword))) {
    return { level: 'ORANGE', urgency: 'VERY URGENT' }
  }
  
  // Default to green
  return { level: 'GREEN', urgency: 'ROUTINE' }
}

/**
 * Generates a cache key for the appointment
 */
function generateCacheKey(appointment: AppointmentData): string {
  const { symptoms = '', condition = '', notes = '', type = '' } = appointment
  return `${symptoms}|${condition}|${notes}|${type}`.toLowerCase().trim()
}

/**
 * Clears the urgency cache
 */
export function clearUrgencyCache(): void {
  urgencyCache.clear()
  console.log('Urgency cache cleared')
}

/**
 * Gets cache statistics
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: urgencyCache.size,
    entries: Array.from(urgencyCache.keys())
  }
}

/**
 * Checks if the service is properly configured
 */
export function isServiceConfigured(): boolean {
  return !!import.meta.env.VITE_GEMINI_API_KEY
}

/**
 * Gets service status information
 */
export function getServiceStatus(): {
  configured: boolean
  cacheSize: number
  lastCacheClear: string
} {
  return {
    configured: isServiceConfigured(),
    cacheSize: urgencyCache.size,
    lastCacheClear: new Date().toISOString()
  }
}
