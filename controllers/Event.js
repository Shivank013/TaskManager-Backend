const Event = require("../models/Event");
const mailSender = require("../utils/mailSender");
const User = require("../models/User");

exports.deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.body;

        // Find and delete the event
        const event = await Event.findByIdAndDelete(eventId);

        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Remove the event ID from the user's events array
        await User.findByIdAndUpdate(event.userId, {
            $pull: { events: eventId }
        });

        return res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Create a new event
exports.createEvent = async (req, res) => {
    try {
        const { title, description, start, end, location, reminderTime, recurring, recurrencePattern } = req.body;
        const userId = req.user.id;

        // Validate end
        if (!end) {
            return res.status(400).json({ success: false, message: "End time is required" });
        }

        // Validate reminderTime
        if (reminderTime && reminderTime >= end) {
            return res.status(400).json({ success: false, message: "Reminder time should be before end time" });
        }

        // Step 1: Create new event without eventId
        let event = await Event.create({
            userId,
            title,
            description,
            start,
            end,
            location,
            reminderTime,
            recurring,
            recurrencePattern: recurring ? recurrencePattern : undefined,
        });

        // Step 2: Update the event with eventId
        event.eventId = event._id;
        await event.save();

        // Step 3: Add the event ID to the user's events array
        await User.findByIdAndUpdate(userId, {
            $push: { events: event._id }
        });

        // Schedule reminder email if reminderTime is provided
        if (reminderTime) {
            setReminderEmail(event, req.user.email);
        }

        return res.json({ success: true, message: "Event created successfully", data: event });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


// Update event description
exports.updateDescription = async (req, res) => {
	try {
		const { eventId, description } = req.body;
		const event = await Event.findByIdAndUpdate(eventId, { description }, { new: true });
		return res.json({ success: true, message: "Description updated successfully", data: event });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

// Update event end time
exports.updateEndTime = async (req, res) => {
    try {
        const { eventId, end } = req.body;

        if (!end) {
            return res.status(400).json({ success: false, message: "End time cannot be null" });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Ensure the new end time is after reminderTime, if reminderTime is set
        if (event.reminderTime && end <= event.reminderTime) {
            return res.status(400).json({ success: false, message: "End time must be after the reminder time" });
        }

        event.end = end;
        await event.save();

        // Schedule reminder email only if reminderTime is set
        if (event.reminderTime) {
            setReminderEmail(event, req.user.email);
        }

        return res.json({ success: true, message: "End time updated successfully", data: event });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update event location
exports.updateLocation = async (req, res) => {
	try {
		const { eventId, location } = req.body;
		const event = await Event.findByIdAndUpdate(eventId, { location }, { new: true });
		return res.json({ success: true, message: "Location updated successfully", data: event });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

// Update reminder time
exports.updateReminderTime = async (req, res) => {
    try {
        const { eventId, reminderTime } = req.body;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Ensure reminderTime is before end
        if (reminderTime >= event.end) {
            return res.status(400).json({ success: false, message: "Reminder time must be before end time" });
        }

        event.reminderTime = reminderTime;
        await event.save();

        // Schedule reminder email only if reminderTime is set
        if (reminderTime) {
            setReminderEmail(event, req.user.email);
        }

        return res.json({ success: true, message: "Reminder time updated successfully", data: event });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update recurring status and pattern
exports.updateRecurringStatus = async (req, res) => {
	try {
		const { eventId, recurring, recurrencePattern } = req.body;

		// If the event is set to recurring, ensure a valid recurrence pattern is provided
		if (recurring && !["daily", "weekly", "monthly"].includes(recurrencePattern)) {
			return res.status(400).json({ success: false, message: "Invalid recurrence pattern" });
		}

		const event = await Event.findByIdAndUpdate(
			eventId,
			{ recurring, recurrencePattern: recurring ? recurrencePattern : undefined },
			{ new: true }
		);

		return res.json({ success: true, message: "Recurring status updated successfully", data: event });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

// Get event details
exports.getEventDetails = async (req, res) => {
	try {
		const { eventId } = req.params;
		const event = await Event.findById(eventId).populate("userId", "email").exec();

		if (!event) {
			return res.status(404).json({ success: false, message: "Event not found" });
		}

		return res.json({ success: true, message: "Event details fetched successfully", data: event });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

// Helper function to schedule a reminder email
const setReminderEmail = (event, userEmail) => {
	const reminderTime = new Date(event.reminderTime) - Date.now();
	if (reminderTime > 0) {
		setTimeout(() => {
			const emailSubject = `Reminder: ${event.title}`;
			const emailBody = `<p>This is a reminder for your upcoming event: <strong>${event.title}</strong></p><p>Description: ${event.description}</p><p>Location: ${event.location}</p><p>Starts at: ${event.start}</p><p>Ends at: ${event.end}</p>`; // updated here
			mailSender(userEmail, emailSubject, emailBody);
		}, reminderTime);
	}
};
