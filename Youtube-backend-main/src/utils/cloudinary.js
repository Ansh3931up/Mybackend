import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name:"dyk154dvi",
    api_key:"865648221428778",
    api_secret:"Wv8AEVcz1I2E69fstVEVqOD1smw",
});

const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath) return null//upload the file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            response_type:"auto"
        })
        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary",response.url);
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)//remove the locally saved temporary file as the upload failed 
        
    }
}

cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
  { public_id: "olympic_flag" }, 
  function(error, result) {console.log(result); });

export {uploadOnCloudinary}


//CLOUDINARY_URL=cloudinary://865648221428778:Wv8AEVcz1I2E69fstVEVqOD1smw@dyk154dvi