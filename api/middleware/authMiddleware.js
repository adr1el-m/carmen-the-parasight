// api/middleware/authMiddleware.js
import { auth } from '../config/firebase.js';

export const authenticateUser = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(401).json({ message: 'Authorization token not provided.' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(403).json({ message: 'Authentication token expired. Please re-authenticate.' });
    }
    return res.status(403).json({ message: 'Invalid or unauthorized token.' });
  }
};

export const authorizeRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.userType) {
      return res.status(403).json({ message: 'Access denied: User type not found in token.' });
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({ message: 'Access denied: Insufficient privileges.' });
    }
    next();
  };
};