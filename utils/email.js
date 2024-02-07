const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Samir Magdy <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //   // sendGrid
      return 1;
      // nodemailer.createTransport({
      //     host: 'smtp-relay.brevo.com',
      //     port: 587,
      //     auth: {
      //       user: 'Master Password',
      //       pass: 'X5UmzPI2D9h3Bcb1',
      //     },
      //   });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render html based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPassword() {
    await this.send(
      'passwordReset', // template name
      'Your password reset token (valid for 10 minutes)',
    );
  }
};

// const sendEmail = async (options) => {
// 1) Create a transporter
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   auth: {
//     user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// host: 'sandbox.smtp.mailtrap.io',
// port: 2525,
// auth: {
//   user: '3c506777c25574',
//   pass: 'eafa665791fd41',
// },
// });

// 2) Define the email options
// const mailOptions = {
//   from: 'Samir Magdy <admin@gmail.com>',
//   to: options.email,
//   subject: options.subject,
//   text: options.message,
// };

// 3) Actually send the email
// await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
