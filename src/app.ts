import server from './server'
import { connectDB } from './config/mongoose'

const PORT = process.env.API_PORT

async function startServer() {

    connectDB()

    server.listen(PORT, () => {
        console.log('Server is running...')
    })
}

startServer();