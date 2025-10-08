const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // Check if email already exists (from local registration)
        const existingEmail = await User.findOne({ 
          email: profile.emails[0].value 
        });

        if (existingEmail) {
          // Link Google account to existing user
          existingEmail.googleId = profile.id;
          existingEmail.avatar = existingEmail.avatar || profile.photos[0].value;
          existingEmail.emailVerified = true;
          await existingEmail.save();
          return done(null, existingEmail);
        }

        // Create new user
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0].value,
          provider: 'google',
          emailVerified: true,
          password: null // OAuth users don't have passwords
        });

        done(null, user);
      } catch (err) {
        console.error('Google OAuth error:', err);
        done(err, null);
      }
    }
  )
);


passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ githubId: profile.id });

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // --- FIX: Safely retrieve email, checking for existence and primary status ---
        let email = null;
        if (profile.emails && profile.emails.length > 0) {
          // 1. Try to find the primary email
          const primaryEmail = profile.emails.find(e => e.primary);
          
          if (primaryEmail) {
            email = primaryEmail.value;
          } else {
            // 2. If no primary email is found, use the first available email
            email = profile.emails[0].value;
          }
        }

        if (!email) {
            // 3. If emails array is missing or empty, use a fallback
            email = `${profile.username}@github.com`; 
        }
        // --- END FIX ---


        // Check if email already exists
        const existingEmail = await User.findOne({ email });

        if (existingEmail) {
          // Link GitHub account to existing user
          existingEmail.githubId = profile.id;
          existingEmail.avatar = existingEmail.avatar || (profile.photos && profile.photos[0].value);
          existingEmail.emailVerified = true;
          await existingEmail.save();
          return done(null, existingEmail);
        }

        // Create new user
        user = await User.create({
          githubId: profile.id,
          name: profile.displayName || profile.username,
          email: email,
          avatar: profile.photos && profile.photos[0].value,
          provider: 'github',
          emailVerified: true,
          password: null // OAuth users don't have passwords
        });

        done(null, user);
      } catch (err) {
        console.error('GitHub OAuth error:', err);
        done(err, null);
      }
    }
  )
);

module.exports = passport;
