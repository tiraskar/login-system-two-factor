import express from 'express';
const router = express();

import {
  register,
  loginUser,
  changePassword,
  sendEmail,
  resetPassword,
  loginWithOtp,
} from '../controller/authController.js';

router.route('/register').post(register);
router.route('/loginUser').post(loginUser);
router.route('/changePassword').patch(changePassword);
router.route('/sendEmail').post(sendEmail);
router.route('/resetPassword').patch(resetPassword);
router.route('/otpLogin').post(loginWithOtp);
export default router;
