import mongoose, { mongo } from "mongoose"

export const connectDB = async ()=>{
    try {
        const conn = await mongoose.connect("mongodb+srv://tuboksmicheal:Jehovah1@cluster0.lxtrxod.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        console.log(`MongoDB connected Successfully: ${conn.connection.host}`)
    } catch (error) {
        console.log("MongoDB connection error", error)
    }
}