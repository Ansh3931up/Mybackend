const asyncHandler=(reqHandler)=>{//ye promise wala syntax ha 
    return (req,res,next)=>{
        Promise
        .resolve(reqHandler(req,res,next))
        .catch((error)=>next(error))
    }
}

export {asyncHandler}

// const a=()={}
// const a=(func)=>()=>{}

// const asyncHandler=(fn)=>async(req,res,next)=>{//higher order function
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         console.log(error);
//         res.status(error.code||400).json({
//             success:false,
//             message:error.message
//         })
//     }

// }
