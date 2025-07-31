# PartnerSignUp Component

## Overview
The `PartnerSignUp` component is a comprehensive registration form for healthcare facilities to join the LingapLink platform. It provides a multi-step form that collects essential information about healthcare facilities and redirects them to the Dashboard upon successful registration.

## Features

### Multi-Step Form
- **Step 1**: Basic Information (Facility name, type, email, phone, password)
- **Step 2**: Location & Contact (Address, city, province, postal code, website)
- **Step 3**: Medical Services (Specialties, services, operating hours)
- **Step 4**: Staff & Capacity (Staff counts, bed capacity, consultation rooms)
- **Step 5**: Additional Information (License number, description, terms acceptance)

### Authentication
- Email/password registration with Firebase Auth
- Google OAuth integration
- Email verification
- Automatic redirection to Dashboard upon success

### Validation
- Real-time form validation
- Error messages for invalid inputs
- Progress tracking with visual indicators

### UI/UX
- Modern, responsive design
- Progress bar showing completion status
- Password visibility toggle
- Loading states and notifications
- Mobile-friendly layout

## Usage

### Route
The component is accessible at `/partner-signup`

### Navigation
Healthcare facilities can access this form through:
- Landing page "Partner with LingapLink" buttons
- Footer "Join LingapLink" links
- Direct URL navigation

### Integration
The component integrates with:
- **Firebase Auth**: For user authentication
- **React Router**: For navigation
- **Dashboard**: Redirects to `/dashboard` after successful registration

## File Structure

```
src/
├── components/
│   └── PartnerSignUp.tsx          # Main component
├── styles/
│   └── partnerSignUp.css          # Component styles
└── App.tsx                        # Route configuration
```

## Component Structure

### State Management
- `formData`: Complete form data object
- `currentStep`: Current step in the multi-step form
- `validationErrors`: Form validation errors
- `isLoading`: Loading states
- `errorMessage`: Error display

### Key Functions
- `validateCurrentStep()`: Validates current form step
- `nextStep()`: Advances to next step
- `handleGoogleSignUp()`: Google OAuth integration
- `showNotification()`: Displays user notifications

## Styling

The component uses a custom CSS file (`partnerSignUp.css`) with:
- Gradient backgrounds
- Modern card-based layout
- Responsive design
- Smooth animations
- Consistent with LingapLink design system

## Future Enhancements

### Planned Features
- Complete multi-step form implementation
- File upload for facility documents
- Advanced validation rules
- Integration with Firestore for facility profiles
- Email templates for verification
- Admin approval workflow

### Additional Steps
- **Step 2**: Location & Contact information
- **Step 3**: Medical specialties and services
- **Step 4**: Staff and capacity details
- **Step 5**: Final verification and terms

## Technical Notes

### Dependencies
- React 18+
- Firebase Auth
- React Router
- Font Awesome icons

### Browser Support
- Modern browsers with ES2020 support
- Mobile-responsive design
- Progressive enhancement

### Security
- Password strength validation
- Email verification required
- Secure Firebase integration
- CSRF protection ready

## Development

### Local Development
1. Ensure Firebase configuration is set up
2. Run `npm run dev` to start development server
3. Navigate to `/partner-signup` to test the component

### Testing
- Form validation
- Google OAuth flow
- Responsive design
- Error handling
- Success flow to Dashboard

## Contributing

When contributing to this component:
1. Follow the existing code style
2. Add proper TypeScript types
3. Include error handling
4. Test on multiple devices
5. Update this documentation

---

**Note**: This component is currently in development with Step 1 fully implemented. Additional steps will be added incrementally. 