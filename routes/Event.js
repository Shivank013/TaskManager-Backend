// Import the required modules
const express = require("express");
const router = express.Router();

// Import the required controllers and middleware functions
const {
  createEvent,deleteEvent,
  updateDescription,
  updateEndTime,
  updateLocation,
  updateReminderTime,
  updateRecurringStatus,
  getEventDetails,
} = require("../controllers/Event");

const { auth } = require("../middlewares/auth");

router.post("/delete", auth, deleteEvent);

// Route for creating a new event
router.post("/create", auth, createEvent);

// Route for updating the event description
router.put("/update-description", auth, updateDescription);

// Route for updating the event end time
router.put("/update-end-time", auth, updateEndTime);

// Route for updating the event location
router.put("/update-location", auth, updateLocation);

// Route for updating the reminder time
router.put("/update-reminder-time", auth, updateReminderTime);

// Route for updating recurring status and pattern
router.put("/update-recurring-status", auth, updateRecurringStatus);

// Route for fetching event details
router.get("/details/:eventId", auth, getEventDetails);

// Export the router for use in the main application
module.exports = router;
