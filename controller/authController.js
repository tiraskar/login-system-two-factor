import User from '../model/Users.js';
import Otp from '../model/OtpResetPassword.js';
import OtpLogin from '../model/OtpLogin.js';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, UnAuthenticatedError } from '../errors/index.js';
import nodemailer from 'nodemailer';
const register = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    throw new BadRequestError('All values are required.');
  }
  if (password === !confirmPassword) {
    throw new BadRequestError("Password doesn't match");
  }
  const userAlreadyExists = await User.findOne({ email });
  if (userAlreadyExists) {
    throw new BadRequestError('Email already used.');
  }
  const user = await User.create({ name, email, password });
  const token = user.createJWT();
  res.status(StatusCodes.CREATED).json({
    user: {
      email: user.email,
      name: user.name,
    },
    token,
  });
};
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError('Please provide all values');
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new UnAuthenticatedError('Invalid email');
  }
  const checkPassword = await user.comparePassword(password);
  if (!checkPassword) {
    throw new UnAuthenticatedError('Invalid password');
  }
  const checkOtpEmail = await OtpLogin.findOne({ email });

  if (checkOtpEmail) {
    checkOtpEmail.deleteOne({ email });
  }
  const optCode = Math.floor(Math.random() * 1000000 + 1);
  const otpData = new OtpLogin({
    email,
    code: optCode,
    expireIn: new Date().getTime() + 120 * 1000,
  });
  await otpData.save();
  mailerLogin(otpData.email, otpData.code);
  const token = user.createJWT();
  user.password = undefined;
  user.previousPassword = undefined;
  res.status(StatusCodes.OK).json({
    user,
    token,
  });
};

const loginWithOtp = async (req, res) => {
  const { otpCode, email } = req.body;
  if (!otpCode) {
    throw new BadRequestError('provide otp code');
  }
  const user = await OtpLogin.findOne({ email });
  const checkOtp = await user.code;
  if (checkOtp !== otpCode) {
    throw new BadRequestError("Otp code doesn't exist");
  }
  const currentTime = new Date().getTime();
  const otpExpireTime = user.expireIn - currentTime;
  if (otpExpireTime < 0) {
    throw new BadRequestError('Otp code expire');
  }

  res.status(StatusCodes.OK).json({
    msg: 'login successful with otp login',
  });
};
const changePassword = async (req, res) => {
  const { oldPassword, newPassword, email } = req.body;

  if (!oldPassword || !newPassword) {
    throw new BadRequestError('All values are required.');
  }
  if (oldPassword === newPassword) {
    throw new BadRequestError("Old and new password can't be same");
  }
  const user = await User.findOne({ email });
  const checkPassword = await user.comparePassword(oldPassword);
  if (!checkPassword) {
    throw new UnAuthenticatedError('Invalid password');
  }
  const isLastPass = await user.checkPasswordHistory(newPassword);
  if (isLastPass) {
    throw new UnAuthenticatedError("You can't use this password twice");
  }
  user.password = newPassword;
  await user.save();
  res.status(StatusCodes.OK).json({ msg: 'Password changed' });
};

const sendEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError('Provide email');
  }
  const checkEmail = await User.findOne({ email });
  if (!checkEmail) {
    throw new UnAuthenticatedError(`Email doesn't exist`);
  }
  const checkOtpEmail = await Otp.findOne({ email });

  if (checkOtpEmail) {
    checkOtpEmail.deleteOne({ email });
  }
  const optCode = Math.floor(Math.random() * 1000000 + 1);
  const otpData = new Otp({
    email,
    code: optCode,
    expireIn: new Date().getTime() + 120 * 1000,
  });
  await otpData.save();
  mailerReset(otpData.email, otpData.code);
  res.status(StatusCodes.OK).json({ msg: 'Check email, otp is sent' });
};

const resetPassword = async (req, res) => {
  const { email, otpCode, password } = req.body;

  if (!email) {
    throw new BadRequestError('Provide email');
  }
  const user = await Otp.findOne({ email });
  if (!user) {
    throw new UnAuthenticatedError("Email doesn't exit..");
  }
  const checkOtp = await user.code;
  if (checkOtp !== otpCode) {
    throw new BadRequestError("Otp code doesn't exist");
  }
  const currentTime = new Date().getTime();
  const otpExpireTime = user.expireIn - currentTime;
  if (otpExpireTime < 0) {
    throw new BadRequestError('Otp code expire');
  }
  //check previous password
  const findUser = await User.findOne({ email });
  const isLastPass = await findUser.checkPasswordHistory(password);
  if (isLastPass) {
    throw new UnAuthenticatedError("You can't use this password twice");
  }
  findUser.password = password;
  await findUser.save();
  res.status(StatusCodes.OK).json({ msg: 'Password reset' });
};
const mailerReset = (email, otp) => {
  let transporter = nodemailer.createTransport({
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    host: 'smtp-mail.outlook.com',
    port: 587,
    tls: {
      rejectUnauthorized: false,
    },
  });
  const mailOption = {
    from: process.env.MAIL_USER,
    to: email,
    subject: 'Password reset',
    html: `Reset your password with the code ${otp}.`,
  };
  transporter.sendMail(mailOption, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};
const mailerLogin = (email, otp) => {
  let transporter = nodemailer.createTransport({
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    host: 'smtp-mail.outlook.com',
    port: 587,
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOption = {
    from: process.env.MAIL_USER,
    to: email,
    subject: 'Login OTP Code',
    html: `Login your account with login code: ${otp}.`,
  };
  transporter.sendMail(mailOption, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

export {
  register,
  loginUser,
  changePassword,
  sendEmail,
  resetPassword,
  loginWithOtp,
};
