// Verifies JWT from Authorization header
import jwt from 'jsonwebtoken'
import { isOidcConfigured, verifyOidcToken } from '../lib/oidc.js'

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]

    if (!process.env.JWT_SECRET && !isOidcConfigured()) {
        return res.status(500).json({ success: false, message: 'Authentication is not configured' })
    }

    try {
        if (process.env.JWT_SECRET) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.user = decoded
            return next()
        }
    } catch (err) {
        if (!isOidcConfigured()) {
            return res.status(403).json({ success: false, message: 'Invalid token' })
        }
    }

    try {
        req.user = await verifyOidcToken(token)
        return next()
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid token' })
    }
}

export default authMiddleware
