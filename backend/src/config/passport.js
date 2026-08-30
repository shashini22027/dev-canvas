import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import 'dotenv/config'
import User from '../models/User.js';

const getAdminEmails = () => (
    (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
);

const buildUsername = (profile, email) => (
    profile.username || email?.split('@')[0] || `google-${profile.id}`
);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/auth/google/callback',
            proxy: true,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // check if user already exists
                let user = await User.findOne({ googleId: profile.id });
                const email = profile.emails?.[0]?.value?.toLowerCase();
                const username = buildUsername(profile, email);
                const isConfiguredAdmin = getAdminEmails().includes(email);

                if (!user) {
                    user = await User.create({
                        googleId: profile.id,
                        email,
                        username,
                        name: profile.displayName,
                        profilePic: profile.photos?.[0]?.value,
                        role: isConfiguredAdmin ? 'ADMIN' : 'STUDENT',
                        isNewUser: !isConfiguredAdmin,
                    })
                } else {
                    let shouldSave = false;

                    if (!user.username) {
                        user.username = username;
                        shouldSave = true;
                    }

                    if (isConfiguredAdmin && user.role !== 'ADMIN') {
                        user.role = 'ADMIN';
                        user.isNewUser = false;
                        shouldSave = true;
                    }

                    if (shouldSave) {
                        await user.save();
                    }
                }
                done(null, user)
            } catch (err) {
                done(err, null)
            }
        }
    )
)

export default passport
