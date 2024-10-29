const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
require("dotenv").config();

// Signup Controller for Registering Users
exports.signup = async (req, res) => {
	try {
		// Destructure fields from the request body
		const { firstName, lastName, email, password, confirmPassword, profession, notification, nickname, otp } = req.body;

		// Check if all required fields are present
		if (!firstName || !lastName || !email || !password || !confirmPassword || !otp || !profession) {
			return res.status(403).send({
				success: false,
				message: "All Fields are required",
			});
		}

		// Check if password and confirm password match
		if (password !== confirmPassword) {
			return res.status(400).json({
				success: false,
				message: "Password and Confirm Password do not match. Please try again.",
			});
		}

		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "User already exists. Please sign in to continue.",
			});
		}

		// Verify the OTP
		const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
		if (response.length === 0 || otp !== response[0].otp) {
			return res.status(400).json({
				success: false,
				message: "The OTP is not valid",
			});
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create the user
		const user = await User.create({
			firstName,
			lastName,
			email,
			password: hashedPassword,
			profession,
			notification,
			nickname,
			image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
		});

		return res.status(200).json({
			success: true,
			user,
			message: "User registered successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: "User cannot be registered. Please try again.",
		});
	}
};

// Login controller for authenticating users
exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Check if email or password is missing
		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: "Please fill up all the required fields",
			});
		}

		// Find user with provided email
		const user = await User.findOne({ email });

		// If user not found
		if (!user) {
			return res.status(401).json({
				success: false,
				message: "User is not registered. Please sign up to continue.",
			});
		}

		// Generate JWT token and compare password
		if (await bcrypt.compare(password, user.password)) {
			const token = jwt.sign(
				{ email: user.email, id: user._id },
				process.env.JWT_SECRET,
				{ expiresIn: "24h" }
			);

			// Save token to user document in the database
			user.token = token;
			await user.save();

			// Set cookie for token and return success response
			const options = {
				expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
				httpOnly: true,
			};
			res.cookie("token", token, options).status(200).json({
				success: true,
				token,
				user,
				message: "User login successful",
			});
		} else {
			return res.status(401).json({
				success: false,
				message: "Password is incorrect",
			});
		}
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: "Login failure. Please try again.",
		});
	}
};

// Send OTP For Email Verification
exports.sendotp = async (req, res) => {
	try {
		const { email } = req.body;

		// Check if user is already registered
		const checkUserPresent = await User.findOne({ email });
		if (checkUserPresent) {
			return res.status(401).json({
				success: false,
				message: "User is already registered",
			});
		}

		// Generate unique OTP
		let otp;
		do {
			otp = otpGenerator.generate(6, {
				upperCaseAlphabets: false,
				lowerCaseAlphabets: false,
				specialChars: false,
			});
		} while (await OTP.findOne({ otp }));

		// Save OTP to database
		await OTP.create({ email, otp });

		res.status(200).json({
			success: true,
			message: "OTP sent successfully",
			otp,
		});
	} catch (error) {
		console.log(error.message);
		return res.status(500).json({ success: false, error: error.message });
	}
};

// Controller for Changing Password
exports.changePassword = async (req, res) => {
	try {
		const userDetails = await User.findById(req.user.id);
		const { oldPassword, newPassword, confirmNewPassword } = req.body;

		// Validate old password
		const isPasswordMatch = await bcrypt.compare(oldPassword, userDetails.password);
		if (!isPasswordMatch) {
			return res.status(401).json({
				success: false,
				message: "The password is incorrect",
			});
		}

		// Check if new passwords match
		if (newPassword !== confirmNewPassword) {
			return res.status(400).json({
				success: false,
				message: "The password and confirm password do not match",
			});
		}

		// Update password
		const encryptedPassword = await bcrypt.hash(newPassword, 10);
		userDetails.password = encryptedPassword;
		await userDetails.save();

		// Send notification email
		try {
			await mailSender(
				userDetails.email,
				passwordUpdated(
					userDetails.email,
					`Password updated successfully for ${userDetails.firstName} ${userDetails.lastName}`
				)
			);
			console.log("Email sent successfully");
		} catch (error) {
			console.error("Error sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
		}

		return res.status(200).json({ success: true, message: "Password updated successfully" });
	} catch (error) {
		console.error("Error updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
	}
};

// Update user profile (name, profession, etc.)
exports.updateProfile = async (req, res) => {
	try {
		const { firstName, lastName, profession } = req.body;
		const userId = req.user.id;

		// Create an object with only non-empty fields
		const updateFields = {};
		if (firstName) updateFields.firstName = firstName;
		if (lastName) updateFields.lastName = lastName;
		if (profession) updateFields.profession = profession;

		// Update the user's profile information only with non-empty fields
		const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

		return res.json({
			success: true,
			message: "Profile updated successfully",
			data: updatedUser,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Delete user account
exports.deleteAccount = async (req, res) => {
	try {
		const userId = req.user.id;

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Delete user
		await User.findByIdAndDelete(userId);

		return res.status(200).json({
			success: true,
			message: "User deleted successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while deleting the user account",
		});
	}
};

// Fetch all user details
exports.getAllUserDetails = async (req, res) => {
	try {
		const userId = req.user.id;
		const userDetails = await User.findById(userId)
			.populate("events")
			.populate("meetings")
			.exec();

		return res.status(200).json({
			success: true,
			message: "User data fetched successfully",
			data: userDetails,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};


exports.updateDisplayPicture = async (req, res) => {
	try {
		const { image } = req.body;
		const userId = req.user.id;

		// Update display picture
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ image },
			{ new: true }
		);

		return res.json({
			success: true,
			message: "image updated successfully",
			data: updatedUser,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Update user's notification status
exports.updateNotificationStatus = async (req, res) => {
	try {
		const { notification } = req.body;
		const userId = req.user.id;

		// Update notification status
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ notification },
			{ new: true }
		);

		return res.json({
			success: true,
			message: "Notification status updated successfully",
			data: updatedUser,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Update user's nickname
exports.updateNickname = async (req, res) => {
	try {
		const { nickname } = req.body;
		const userId = req.user.id;

		// Update nickname
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ nickname },
			{ new: true }
		);

		return res.json({
			success: true,
			message: "Nickname updated successfully",
			data: updatedUser,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Controller for Generating Reset Password Token and Sending Email
exports.resetPasswordToken = async (req, res) => {
    try {
        const email = req.body.email;

        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: `This Email: ${email} is not registered. Please enter a valid email.`,
            });
        }

        // Generate reset token and expiration
        const token = crypto.randomBytes(20).toString("hex");
        const resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration

        // Update user document with token and expiration
        await User.findByIdAndUpdate(
            user._id,
            {
                token,
                resetPasswordExpires,
            },
            { new: true }
        );

        const resetUrl = `http://localhost:3000/update-password/${token}`; // need to be chnage-----------------

        // Send reset email
        await mailSender(
            email,
            "Password Reset",
            `Your password reset link: ${resetUrl}. Please click the link to reset your password.`
        );

        return res.status(200).json({
            success: true,
            message: "Email sent successfully. Please check your email to continue.",
        });
    } catch (error) {
        console.error("Error in resetPasswordToken:", error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while sending the reset message.",
        });
    }
};

// Controller for Resetting Password
exports.resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword, token } = req.body;

        // Validate password and confirm password match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and Confirm Password do not match.",
            });
        }

        // Find user by token and check if it hasn't expired
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid token.",
            });
        }
        if (user.resetPasswordExpires < Date.now()) {
            return res.status(403).json({
                success: false,
                message: "Token has expired. Please request a new one.",
            });
        }

        // Hash new password and update user document
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.findByIdAndUpdate(
            user._id,
            {
                password: hashedPassword,
                token: null, // Clear the reset token
                resetPasswordExpires: null, // Clear expiration date
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Password reset successful.",
        });
    } catch (error) {
        console.error("Error in resetPassword:", error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while resetting the password.",
        });
    }
};