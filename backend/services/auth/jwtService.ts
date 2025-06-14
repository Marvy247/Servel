import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { User } from '../../types/user';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = '1h'; // Default to 1 hour if not specified

interface TokenPayload {
  id: string;
  githubToken: string;
  username: string;
}

export function generateToken(payload: TokenPayload): string {
  const signOptions: SignOptions = {
    expiresIn: JWT_EXPIRES_IN
  };
  
  return jwt.sign(
    { 
      id: payload.id,
      githubToken: payload.githubToken,
      username: payload.username 
    },
    JWT_SECRET,
    signOptions
  );
}

export function verifyToken(token: string): User | null {
  try {
    return jwt.verify(token, JWT_SECRET) as User;
  } catch (err) {
    return null;
  }
}
