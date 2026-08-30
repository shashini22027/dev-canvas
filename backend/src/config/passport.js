import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import 'dotenv/config'
import User from '../models/User.js';

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

                if (!user) {
                    const email = profile.emails?.[0]?.value;
                    user = await User.create({
                        googleId: profile.id,
                        email,
                        username: profile.username || email?.split('@')[0] || profile.id,
                        name: profile.displayName,
                        profilePic: profile.photos?.[0]?.value,
                        role: 'STUDENT',
                        isNewUser: true,
                    })
                }
                done(null, user)
            } catch (err) {
                done(err, null)
            }
        }
    )
)

export default passport
