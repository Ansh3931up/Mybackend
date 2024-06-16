import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js';
const connectDB=async()=>{
    try {
        const Connection=await mongoose.connect(`mongodb+srv://ANSH3931:myself2211@cluster0.jevm3xi.mongodb.net/${DB_NAME}`)
        console.log(`your database is connected to the ${Connection.connection.host}`)

    } catch (error) {
        console.log(error);
        process.exit(1)
        
    }
}
export default connectDB;