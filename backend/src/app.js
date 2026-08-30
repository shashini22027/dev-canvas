
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import 'dotenv/config'
import passport from './config/passport.js'
import authRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'
import projectRoutes from './routes/project.routes.js'
import likeRoutes from './routes/like.routes.js'
import followRoutes from './routes/follow.routes.js'
import notificationRoutes from "./routes/notification.routes.js";
import userRoutes from './routes/user.routes.js';
import { rejectNoSqlOperators, requireHttps, limitRequestBody, createRateLimiter, getSafeErrorMessage, getSecurityHeadersConfig } from './middleware/security.middleware.js';
import "./events/listners.js"; // register all event listeners


const app = express()
const apiRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 200 })
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again later.'
})

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(requireHttps)
app.use(helmet(getSecurityHeadersConfig()))
app.use(morgan('dev'))
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(cookieParser())
app.use(limitRequestBody)
app.use(apiRateLimiter)
app.use('/api/auth', authRateLimiter)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(rejectNoSqlOperators)
app.use(passport.initialize())


app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/likes', likeRoutes)
app.use('/api/follows', followRoutes)
app.use("/api/notifications", notificationRoutes);
app.use('/api/users', userRoutes);



app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = getSafeErrorMessage(status, err);

  console.error(`[error] ${status} ${req.method} ${req.originalUrl}`, err?.stack || err?.message || err);

  res.status(status).json({
    success: false,
    message,
  });
});

export default app;
