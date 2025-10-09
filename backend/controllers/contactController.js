const nodemailer = require('nodemailer');

// POST /api/contact
exports.sendFeedback = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Configure nodemailer transporter using your EMAIL_USER and EMAIL_PASS
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,      // your email
        pass: process.env.EMAIL_PASS,      // your app password
      },
    });

    
    const mailOptions = {
        from: email,
        to: process.env.EMAIL_USER, // Receive feedback at your email
        subject: `New Contact Form Message from ${name}`,
        html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/> ${message}</p>
        `,
    };
    
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Feedback sent successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong while sending feedback' });
  }
};
