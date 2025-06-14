import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Request } from 'express';
import { generateToken } from '../services/auth/jwtService';
import { User } from '../types/user';

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackURL: process.env.GITHUB_CALLBACK_URL || '',
    passReqToCallback: true
  },
  (req: Request, accessToken: string, refreshToken: string, profile: any, done: any) => {
    // Create complete user object first with empty token
    const user: User = {
      id: profile.id.toString(),
      githubToken: accessToken,
      username: profile.username,
      displayName: profile.displayName,
      emails: profile.emails?.map((e: { value: string }) => ({ value: e.value })),
      profile: {
        id: profile.id,
        login: profile.username,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        avatar_url: profile.photos?.[0]?.value,
        html_url: profile.profileUrl
      },
      token: '' // Initialize with empty string
    };

    // Generate JWT token with required payload fields
    const token = generateToken({
      id: user.id,
      githubToken: user.githubToken,
      username: user.username
    });
    user.token = token;
    
    return done(null, user);
  }
));

export default passport;
