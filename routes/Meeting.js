// Import the required modules
const express = require("express");
const router = express.Router();

// Import the required controllers and middleware functions
const {
    createMeeting,deleteMeet,
    updateDescription,
    updateEndTime,
    updateLocation,
    addOrUpdateMeetingLink,
    updateReminderTime,
    getMeetingDetails,
} = require("../controllers/Meeting");

const { auth } = require("../middlewares/auth");

router.post("/delete", auth, deleteMeet);

// Route for creating a new meeting
router.post("/create", auth, createMeeting);

// Route for updating the meeting description
router.put("/update-description", auth, updateDescription);

// Route for updating the meeting end time
router.put("/update-end-time", auth, updateEndTime);

// Route for updating the meeting location
router.put("/update-location", auth, updateLocation);

// Route for adding or updating the meeting link
router.put("/update-meeting-link", auth, addOrUpdateMeetingLink);

// Route for updating the reminder time
router.put("/update-reminder-time", auth, updateReminderTime);

// Route for fetching meeting details
router.get("/details/:meetingId", auth, getMeetingDetails);

// Export the router for use in the main application
module.exports = router;
