import nodemailer from "nodemailer";

import config from "./config.js";

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  secure: true,
  port: config.smtpPort,
  auth: {
    user: config.smtpUsername,
    pass: config.smtpPassword,
  },
});

export const sendMail = ({ subject, html, text, to }) => {
  return transporter.sendMail({
    subject,
    html,
    text,
    to,
    from: config.emailFromAddress,
  });
};

export const sendForgotPasswordEmail = ({ to, resetCode, userId }) => {
  const link = `${config.frontendUrl}/auth/reset-password?userId=${userId}&resetCode=${resetCode}`;
  const html = `
<p>To reset your password, please visit the following link:</p>
<p><a href="${link}">Password reset link</a></p>
`;
  const text = `To reset your password, please visit the following link:
Link: ${link}
`;

  return sendMail({
    subject: "Reset password link",
    to,
    html,
    text,
  });
};
