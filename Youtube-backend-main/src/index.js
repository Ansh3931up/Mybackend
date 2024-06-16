import connectDB from "./db/index.js";
// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
// import express from 'express';
import {app} from './app.js'
// app=express();
// const PORT=process.env.PORT;



dotenv.config({
    path:'./.env'
})


connectDB()
.then(()=>{
    app.listen( 8090,()=>{
        console.log(`Server is running at port:${8090}`);
    })
})
.catch((err)=>{
    console.log("MONGO db connection failed !!!",err)
})



// app.listen(PORT,()=>{
//     console.log(`server is running on http://localhost:${PORT}`)
// })