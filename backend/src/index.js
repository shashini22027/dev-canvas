import 'dotenv/config'
import fs from 'fs'
import https from 'https'
import app from './app.js'
import connectDB from './lib/db.js'
import './lib/cloudinary.js' 

const PORT = process.env.PORT || 3000

const createServer = () => {
    if (process.env.HTTPS_ENABLED !== 'true') {
        return {
            protocol: 'http',
            listen: (port, callback) => app.listen(port, callback),
        }
    }

    if (!process.env.HTTPS_KEY_PATH || !process.env.HTTPS_CERT_PATH) {
        throw new Error('HTTPS_KEY_PATH and HTTPS_CERT_PATH are required when HTTPS_ENABLED=true')
    }

    const credentials = {
        key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
        cert: fs.readFileSync(process.env.HTTPS_CERT_PATH),
    }

    return {
        protocol: 'https',
        listen: (port, callback) => https.createServer(credentials, app).listen(port, callback),
    }
}

async function main() {
    await connectDB()

    const server = createServer()
    server.listen(PORT, () => {
        console.log(`Server running on ${server.protocol}://localhost:${PORT}`)
    })
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
