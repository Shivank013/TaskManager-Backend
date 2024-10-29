const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
			trim: true,
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			unique: true, // Prevent duplicate emails
		},
		nickname: {
			type: String,
			trim: true,
		},
		password: {
			type: String,
			required: true,
		},
		profession: { // Corrected from 'profection'
			type: String,
			required: true,
			trim: true,
		},
		notification: {
			type: Boolean,
			default: true,
		},
		events: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Event",
			},
		],
		meetings: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Meeting",
			},
		],
		token: {
			type: String,
		},
		resetPasswordExpires: {
			type: Date,
		},
		image: {
			type: String,
		},
	},
	{ timestamps: true } 
);

module.exports = mongoose.model("User", userSchema);
