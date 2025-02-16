const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: 'truecodersja@gmail.com', // Your Outlook email
        pass: 'iabd qqau viim tirz' // Your password or app password
    }
  });

// Define email options
const mailOptions = {
    from: 'Team SSB', // Sender address
    subject: 'Verify your SoulSync Account', // Subject line
};

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

// Send the email
async function sendOTP(email) {
    mailOptions.to=email;
    let otp=generateOTP();
    mailOptions.text="Your OTP to verify your SoulSync account is "+otp;
    try {
        const info=transporter.sendMail(mailOptions);
        return {
            status: 'success',
            otp: otp
        }
    } catch(error) {
        console.log("Error sending mail: ", error);
        return {
            status: error,
            error: "internal-error"
        }
    }
}

module.exports={ sendOTP };