const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1. Create a transporter
  const transporter = nodemailer.createTransport({
    // service: 'Gmail',
    // auth: {
    //   user: process.env.EMAIL_USER,
    //   pass: process.env.EMAIL_PASSWORD,
    // },
    // Activate in gmail "less secure app" option
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    secure: false,
    // logger: true,
    tls: {
      rejectUnauthorized: true,
    },
  });
  //2. Define email options
  const mailOptions = {
    from: 'Guillaume Breyer <hello@guillaume.io',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };
  //3. Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
