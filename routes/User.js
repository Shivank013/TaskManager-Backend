// Import the required modules
const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");

  const {
    login,
    signup,
    sendotp,
    changePassword,
    resetPasswordToken,
    resetPassword,
    updateProfile,
    deleteAccount,
    getAllUserDetails,
    updateDisplayPicture,
    updateNotificationStatus,
    updateNickname,
  } = require("../controllers/User"); 


// Route for user login
router.post("/login", login);

// Route for user signup
router.post("/signup", signup);

// Route for sending OTP to the user's email
router.post("/sendotp", sendotp);

// Route for Changing the password
router.post("/changepassword", auth, changePassword);

// Route for generating a reset password token
router.post("/reset-password-token", resetPasswordToken);

// Route for resetting user's password after verification
router.post("/reset-password", resetPassword);

// Route for updating user profile (name, profession, etc.)
router.put("/update-profile", auth, updateProfile);

// Route for deleting user account
router.delete("/delete-account", auth, deleteAccount);

// Route for fetching all user details
router.get("/user-details", auth, getAllUserDetails);

// Route for updating user's display picture
router.put("/update-display-picture", auth, updateDisplayPicture);

// Route for updating user's notification status
router.put("/update-notification-status", auth, updateNotificationStatus);

// Route for updating user's nickname
router.put("/update-nickname", auth, updateNickname);

// Export the router for use in the main application
module.exports = router;
