const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, htmlContent) => {

  try
  {
    console.log("Sending email function starts");
      const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const result = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: htmlContent
  });
    if(!result) console.log("No result from nodemailer");

  console.log("Email sent successfully:");
  return { success: true, message: "Email sent successfully" };

  }
  catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: "Failed to send email" };
  }
};

module.exports = { sendEmail };