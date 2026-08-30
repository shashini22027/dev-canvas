// OAuth callback and JWT issue logic
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'

const getAdminEmails = () => (
    (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
)

const decodeJwtPayload = (token) => {
    const payload = token?.split('.')[1]
    if (!payload) throw new Error('Invalid ID token')

    return JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
}

const createUniqueUsername = async (baseUsername) => {
    const base = (baseUsername || 'user').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 40) || 'user'
    let username = base
    let suffix = 1

    while (await User.exists({ username })) {
        username = `${base}${suffix}`
        suffix += 1
    }

    return username
}

const getClaimValue = (claims, keys) => {
    for (const key of keys) {
        if (claims[key]) return claims[key]
    }

    return undefined
}

const getEmailFromClaims = (claims) => {
    const email = getClaimValue(claims, [
        'email',
        'emailAddress',
        'emailaddress',
        'http://wso2.org/claims/emailaddress',
        'http://wso2.org/claims/email',
    ])

    if (Array.isArray(email)) return email[0]?.toLowerCase()
    return email?.toLowerCase()
}

const createApiToken = (user) => jwt.sign(
    {
        id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        isNewUser: user.isNewUser,
        csrfToken: crypto.randomBytes(32).toString('hex'),
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
)

const getAsgardeoConfig = () => {
    const orgName = process.env.ASGARDEO_ORG_NAME
    const baseUrl = process.env.ASGARDEO_BASE_URL || (orgName ? `https://api.asgardeo.io/t/${orgName}` : '')

    return {
        clientId: process.env.ASGARDEO_CLIENT_ID,
        clientSecret: process.env.ASGARDEO_CLIENT_SECRET,
        callbackUrl: process.env.ASGARDEO_CALLBACK_URL || `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/asgardeo/callback`,
        authorizeEndpoint: process.env.ASGARDEO_AUTHORIZE_ENDPOINT || `${baseUrl}/oauth2/authorize`,
        tokenEndpoint: process.env.ASGARDEO_TOKEN_ENDPOINT || `${baseUrl}/oauth2/token`,
        userInfoEndpoint: process.env.ASGARDEO_USERINFO_ENDPOINT || `${baseUrl}/oauth2/userinfo`,
        logoutEndpoint: process.env.ASGARDEO_LOGOUT_ENDPOINT || `${baseUrl}/oidc/logout`,
    }
}

export const startAsgardeoLogin = (req, res) => {
    const config = getAsgardeoConfig()

    if (!config.clientId || !config.authorizeEndpoint) {
        return res.status(500).json({ success: false, message: 'Asgardeo login is not configured' })
    }

    const state = crypto.randomBytes(16).toString('hex')
    res.cookie('asgardeo_oauth_state', state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000,
    })

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.callbackUrl,
        scope: process.env.ASGARDEO_SCOPES || 'openid profile email',
        state,
    })

    res.redirect(`${config.authorizeEndpoint}?${params.toString()}`)
}

export const handleAsgardeoCallback = async (req, res, next) => {
    try {
        const config = getAsgardeoConfig()
        const { code, state } = req.query
        const storedState = req.cookies?.asgardeo_oauth_state
        res.clearCookie('asgardeo_oauth_state')

        if (!code) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=Missing Asgardeo authorization code`)
        }

        if (!state || !storedState || state !== storedState) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=Invalid Asgardeo login state`)
        }

        const tokenResponse = await fetch(config.tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: config.callbackUrl,
                client_id: config.clientId,
                client_secret: config.clientSecret,
            }),
        })

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text()
            console.error('Asgardeo token exchange failed:', errorText)
            return res.redirect(`${process.env.CLIENT_URL}/login?error=Failed to complete Asgardeo login`)
        }

        const tokens = await tokenResponse.json()
        const idTokenClaims = decodeJwtPayload(tokens.id_token)
        let userInfoClaims = {}

        if (!idTokenClaims.email && tokens.access_token) {
            const userInfoResponse = await fetch(config.userInfoEndpoint, {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            })

            if (userInfoResponse.ok) {
                userInfoClaims = await userInfoResponse.json()
            }
        }

        const claims = { ...userInfoClaims, ...idTokenClaims }
        const email = getEmailFromClaims(claims)
        if (!email) {
            console.error('Asgardeo email claim missing. Available claims:', Object.keys(claims))
            return res.redirect(`${process.env.CLIENT_URL}/login?error=Asgardeo email claim is required`)
        }

        const username = claims.preferred_username || claims.username || email.split('@')[0] || claims.sub
        const isConfiguredAdmin = getAdminEmails().includes(email)

        let user = await User.findOne({ googleId: `asgardeo:${claims.sub}` })

        if (!user && email) {
            user = await User.findOne({ email })
        }

        if (!user) {
            user = await User.create({
                googleId: `asgardeo:${claims.sub}`,
                email,
                username: await createUniqueUsername(username),
                name: claims.name || username,
                profilePic: claims.picture,
                role: isConfiguredAdmin ? 'ADMIN' : 'STUDENT',
                isNewUser: !isConfiguredAdmin,
            })
        } else {
            user.googleId = user.googleId || `asgardeo:${claims.sub}`
            user.username = user.username || username
            user.name = user.name || claims.name || username
            user.profilePic = user.profilePic || claims.picture
            if (isConfiguredAdmin) {
                user.role = 'ADMIN'
                user.isNewUser = false
            }
            await user.save()
        }

        if (user.isDisabled) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=Account suspended. Please contact support.`)
        }

        const token = createApiToken(user)
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`)
    } catch (err) {
        console.error('Asgardeo callback failed:', err.message)
        return res.redirect(`${process.env.CLIENT_URL}/login?error=Failed to complete Asgardeo login`)
    }
}

export const logoutFromAsgardeo = (req, res) => {
    const config = getAsgardeoConfig()
    const redirectUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    const params = new URLSearchParams({ post_logout_redirect_uri: redirectUrl })

    res.redirect(`${config.logoutEndpoint}?${params.toString()}`)
}

export const handleGoogleCallback = (req, res) => {

    const user = req.user

    if (user.isDisabled) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=Account suspended. Please contact support.`)
    }

    const token = createApiToken(user)

    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`)
}

export const selectRole = async (req, res, next) => {
    try {
        const { role } = req.body

        if (!['STUDENT', 'RECRUITER'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' })
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { role, isNewUser: false },
            { new: true }
        )

        // issue a fresh token with updated role
        const token = createApiToken(user)

        res.json({ success: true, token, user })
    } catch (err) {
        next(err)
    }
}


export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
}

export const updateProfile = async (req, res, next) => {
    try {
        const { name, profilePic } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, profilePic },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // issue a fresh token with updated profile info
        const token = createApiToken(user);

        res.json({ success: true, token, user });
    } catch (err) {
        next(err);
    }
}



