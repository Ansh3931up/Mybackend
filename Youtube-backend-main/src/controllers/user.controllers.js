import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
//new method

const generateAccessandrefershToken=async(userid)=>{
    try {
        const user=await User.findById(userid)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken;
        user.save({ validateBeforeSave:false})

        return {accessToken,refreshToken}


        
    } catch (error) {
        throw new ApiError(500,"unable to generate access and refresh token")
    }
}
const registerUser=asyncHandler(async(req,res)=>{
    // data ko get krna frontend sa
    //check krna ki sara data aa gaya 
    //user already exists :username,email
    //photo ka location lanba 
    //cloudinary pe upload krna 
    //user create krna 
    //remove password and refreshtoken
    //check user create 
    //return response

    const {fullname,username,email,password}=req.body;

    if(
        [fullname,username,email,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"input all the credentials required")
    }

    const existingUser=await User.findOne({
        $or:[{username},{email}]
    })
    if(existingUser){
        throw new ApiError(409,"User already existed")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;//ye req ka extra path files vala multer provide krata ha
    // const coverImageLocalPath=req.files?.coverImage[0]?.path; 
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar path is not found")
    }


    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage= await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"avatar is enable to be storaed")
    }

    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username,
    })
    
    const createUser=await User.findById(user._id).select(
        "-password -refreshToken"//id seelect krka password and refreshToken isma sa delete kr diya
    )
        //isa pta chalaga ki user create bi hua ha ki nhi

    if(!createUser){
        throw new ApiError(400,"Something went wrong while registering the user")
    }
    await user.save();

    return res.status(201).json(
        new ApiResponse(200,createUser,"User created successfully" )
    )
})

const loginUser=asyncHandler(async(req,res)=>{
    //req.body sa data
    //username,email
    //check for user in database,
    //check is the password correct using methods in user schema 
    //generate accessToken and refershToken
    //store token in user
    //send cokkies and its options uisng httpOnly and secure 
    //send response


    //req.body> data
    const {username,password,email}=req.body;
    // if(
    //     [username,email].some((field)=>field?.trim()==="")
    // ){
    //     throw new ApiError(400,"data is missing")
    // }
    // if(!(username || email)){
    //     throw new ApiError(400,"username or email is missing ")
    // }
    //username or email
    const user=await User.findOne({
        $or: [{username},{email}]
    }
    )
    if(!user){
        throw new ApiError(404,"user not found")
    }
    //
    const isPasswordValid= await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Password is not correct")
    }
    const {accessToken,refreshToken}=await generateAccessandrefershToken(user._id);
    const loggedInUser=await user.findById(user._id).select("-password -refershToken")//vo user jiska pass refershToken hai


    const options={
        httpOnly:true,
        secure:true
    }

    return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            }
            ,
            "user logged in successfully"
        ))

    //send cookies



})


const logoutUser=asyncHandler(async(req,res)=>{
    //cookie ko delete krna
    //accessToken and refreshToken ko delete krna 
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:
            {refreshToken:undefined}
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logout "))

})

const refreshTokenAccess=asyncHandler(async(req,res,next)=>{//agar user ka time expires ho jaaye but content dekhna hai to refresh token verify kra ka access mil jaaga
    const incomingrefreshToken=req.cookie.refreshToken||req.body.refreshToken;

    if(!incomingrefreshToken){
        throw new ApiError(401,"Unauthorized error")
    }
    try {
        const decodedrefreshtoken=jwt.verify(incomingrefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user=await User.findById(decodedrefreshtoken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingrefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Invalid refreshToken")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newrefreshToken}=await generateAccessandrefershToken(user._id)
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refershToken",newrefreshToken,options)
        .json(new ApiResponse(200,
            {accessToken,refreshToken:newrefreshToken}
            ,
            "Access token refreshed successfully"))
    } catch (error) {
        throw new ApiError(500,error?.message||"invalid authoriziation")
        
    }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;
    // if(newPassword!=confPassword){
    //     throw new ApiError(400,"newpassword and confpassword is not same")
    // }

    const user=await User.findById(req.user?._id)
    const isPasswordValids=await user.isPasswordCorrect(oldPassword)
    if(!isPasswordValids){
        throw new ApiError(401,"unauthorized access wrong password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})// baaki sab same rhta hai

    return res
    .status(200)
    .json(new ApiResponse(200,"password changed successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body
    if(!fullname||!email){
        throw new ApiError(404,"all fields are required")
    }
    const user=User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:
            {fullname,email}
        },
        {
            new:
            true
        }
    ).select("-password -refreshToken")
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar path not found")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"error while uploading files")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:
            {avatar:avatar.url},
        },
        {
            new:
            true
        }
    ).select("-password -refreshToken")
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar image updated successfully"))
})
const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params
    if(!username?.length){
        throw new ApiError(400,"Username not found")
    }
    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscribers",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelssubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        }
        ,{
            $project:{
                fullname:1,
                username:1,
                email:1,
                subscribersCount:1,
                channelssubscribedToCount:1,
                avatar:1
                ,coverImage:1,
                isSubscribed:1
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404,"channel doesn't exist")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"user channel fetched successful"))

})
const getUserWatchHistory=asyncHandler(async(req,res)=>{
    // req.user._id//yaha sa hma mongodb ki id milti ha jo string form ma hota ha but by using mongoose vo apna aap is id ko format ma la aata ha but when we are using it in aggregrate then hma khud sa issa change krna hota ha

    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"user",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]

                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"successful aggregrated watchHistory"))
})
export{
    registerUser,
    loginUser,
    logoutUser,
    refreshTokenAccess,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    getUserChannelProfile,
    getUserWatchHistory
}