import mongoose from "mongoose";

export async function connectDB() {
    try {

        const mongoUri = process.env.MONGO_URI

        if(!mongoUri) {
            console.error('MONGO_URI was not defined');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI!)

        console.log('MongoDB is connected!')
    }
    catch(err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}