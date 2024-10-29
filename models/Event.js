const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		eventId: {
            type: String,
            default: function () { return this._id.toString(); }, // Set eventId to match _id
            trim: true,
        },
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		start: {
			type: Date,
			required: true,
		},
		end: {
			type: Date,
		},
		location: {
			type: String,
			trim: true,
		},
		reminderTime: {
			type: String,
		},
		recurring: {
			type: Boolean,
			default: false,
		},
		recurrencePattern: {
			type: String,
			enum: ["daily", "weekly", "monthly"],
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
