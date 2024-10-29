const otpTemplate = (otp) => {
	return `<!DOCTYPE html>
	<html>
	<body>
		<p>Dear User,</p>
		<p>Thank you for registering with Task Manager. To complete your registration, please use the following OTP (One-Time Password) to verify your account:</p>
		<h2>${otp}</h2>
		<p>This OTP is valid for 5 minutes. If you did not request this verification, please disregard this email.</p>
		<p>Once your account is verified, you will have access to our platform and its features.</p>
		<p>If you have any questions or need assistance, please reach out to us at <a href="mailto:info@taskmanager.com">info@taskmanager.com</a>.</p>
	</body>
	</html>`;
};

module.exports = otpTemplate;
