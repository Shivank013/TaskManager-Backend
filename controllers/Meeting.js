const Meeting = require("../models/Meeting");
const mailSender = require("../utils/mailSender");
const User = require("../models/User");

exports.deleteMeet = async (req, res) => {
    try {
        const { eventId } = req.body;

        // Find and delete the meeting
        const meet = await Meeting.findByIdAndDelete(eventId); // Changed Event to Meeting

        if (!meet) {
            return res.status(404).json({ success: false, message: "Meeting not found" }); // Updated the message
        }

        // Remove the event ID from the user's meetings array
        await User.findByIdAndUpdate(meet.userId, {
            $pull: { meetings: eventId }
        });

        return res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


// Create a new meeting
exports.createMeeting = async (req, res) => {
    try {
        const { title, description, start, end, location, meetingLink, reminderTime } = req.body;
        const userId = req.user.id;

        // Validate end
        if (!end) {
            return res.status(400).json({ success: false, message: "End time is required" });
        }

        console.log(
            { title, description, start, end, location, meetingLink, reminderTime }
        );

        // Validate reminderTime
        if (reminderTime && reminderTime >= end) {
            return res.status(400).json({ success: false, message: "Reminder time should be before end time" });
        }

        // Step 1: Create new meeting without meetId
        let meeting = await Meeting.create({
            userId,
            title,
            description,
            start,
            end,
            location,
            meetingLink,
            reminderTime
        });

        // Step 2: Update the meeting with meetId
        meeting.meetId = meeting._id;
        await meeting.save();

        // Step 3: Push meeting ID to user's meetings array
        await User.findByIdAndUpdate(userId, {
            $push: { meetings: meeting._id }
        });

        // Schedule reminder email if reminderTime is provided
        if (reminderTime) {
            setReminderEmail(meeting, req.user.email);
        }

        return res.json({ success: true, message: "Meeting created successfully", data: meeting });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


// Update meeting description
exports.updateDescription = async (req, res) => {
    try {
        const { meetingId, description } = req.body;
        const meeting = await Meeting.findByIdAndUpdate(meetingId, { description }, { new: true });
        return res.json({ success: true, message: "Description updated successfully", data: meeting });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update meeting end time
exports.updateEndTime = async (req, res) => {
    try {
        const { meetingId, end, notification } = req.body;

        if (!end) {
            return res.status(400).json({ success: false, message: "End time cannot be null" });
        }

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        // Ensure the new end is after reminderTime, if reminderTime is set
        if (meeting.reminderTime && end <= meeting.reminderTime) {
            return res.status(400).json({ success: false, message: "End time must be after the reminder time" });
        }

        meeting.end = end;
        await meeting.save();

        // Schedule reminder email if notification is true and reminderTime is set
        if (notification && meeting.reminderTime) {
            setReminderEmail(meeting, req.user.email);
        }

        return res.json({ success: true, message: "End time updated successfully", data: meeting });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update meeting location
exports.updateLocation = async (req, res) => {
    try {
        const { meetingId, location } = req.body;
        const meeting = await Meeting.findByIdAndUpdate(meetingId, { location }, { new: true });
        return res.json({ success: true, message: "Location updated successfully", data: meeting });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Add or update meeting link
exports.addOrUpdateMeetingLink = async (req, res) => {
    try {
        const { meetingId, meetingLink } = req.body;
        const meeting = await Meeting.findByIdAndUpdate(meetingId, { meetingLink }, { new: true });
        return res.json({ success: true, message: "Meeting link updated successfully", data: meeting });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update reminder time
exports.updateReminderTime = async (req, res) => {
    try {
        const { meetingId, reminderTime, notification } = req.body;

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        // Ensure reminderTime is before end
        if (reminderTime >= meeting.end) {
            return res.status(400).json({ success: false, message: "Reminder time must be before end time" });
        }

        meeting.reminderTime = reminderTime;
        await meeting.save();

        // Schedule reminder email if notification is true
        if (notification) {
            setReminderEmail(meeting, req.user.email);
        }

        return res.json({ success: true, message: "Reminder time updated successfully", data: meeting });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get meeting details
exports.getMeetingDetails = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const meeting = await Meeting.findById(meetingId).populate("userId", "email").exec();

        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        return res.json({ success: true, message: "Meeting details fetched successfully", data: meeting });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function to schedule a reminder email
const setReminderEmail = (meeting, userEmail) => {
    const reminderTime = new Date(meeting.reminderTime) - Date.now();
    if (reminderTime > 0) {
        setTimeout(() => {
            const emailSubject = `Reminder: ${meeting.title}`;
            const emailBody = `<p>This is a reminder for your upcoming meeting: <strong>${meeting.title}</strong></p>
                               <p>Description: ${meeting.description}</p>
                               <p>Location: ${meeting.location}</p>
                               <p>Meeting Link: ${meeting.meetingLink}</p>
                               <p>Starts at: ${meeting.start}</p>
                               <p>Ends at: ${meeting.end}</p>`;
            mailSender(userEmail, emailSubject, emailBody);
        }, reminderTime);
    }
};
