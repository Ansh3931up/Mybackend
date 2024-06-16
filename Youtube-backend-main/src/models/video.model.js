import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
const videoSchema=new mongoose.Schema(
    {
        videoFile:{
            type:String,//cloudinary url,
            required:true

        },
        thumbnail:{
            type:String,//cloudinary url
            required:true
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        duration:{
            type:Number,//cloudinary
            required:true
        },
        views:{
            type:Number,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        owner:{
            type:Schema.Type.ObjectId,
            ref:"user"

        }
    }
    ,{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)

module.exports=mongoose.model("Video",videoSchema);