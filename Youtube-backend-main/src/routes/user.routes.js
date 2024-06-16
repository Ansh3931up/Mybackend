import { Router } from "express";
import { registerUser,loginUser,logoutUser,refreshTokenAccess, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, getUserChannelProfile, getUserWatchHistory} from "../controllers/user.controllers.js";
const router=Router();
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },{
            name:"coverImage",
            maxCount:1
        }
    ]),registerUser);

router.route("/login").post(loginUser);
//secured Routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refersh-token").post(refreshTokenAccess)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)//patch sa particular details hi update hoti hai
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getUserWatchHistory)

export default router;