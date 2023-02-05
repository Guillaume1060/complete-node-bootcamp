const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
// const nodemailerSendgrid = require('nodemailer-sendgrid');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Guillaume Breyer <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      ////--JE N AI PAS REUSSI A ENVOYER LE MAIL EN PROD AVEC SENDGRID-A REVOIR--/////
      console.log('step newTransport ça plante là');
      // SENDGRIG (real emails)
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        // service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
      // return nodemailer.createTransport({
      //   service: 'SendGrid',
      //   auth: {
      //     user: process.env.SENDGRID_USERNAME,
      //     pass: process.env.SENDGRID_PASSWORD,
      //   },
      // });
    }

    return nodemailer.createTransport({
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
  }

  // Send the actual email
  async send(template, subject) {
    // 1. Render the html based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );
    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      // ? FromString ? ot toString ? Attention déprépcié >version5
      text: htmlToText.fromString(html),
    };

    // 3. Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    console.log('step3-OK');
    console.log(this);
    await this.send('welcome', 'Welcome to the Natour family!');
    console.log('step4-OK');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid 10 minutes)'
    );
  }
};
