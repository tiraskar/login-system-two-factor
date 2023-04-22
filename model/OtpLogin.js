import mongoose from 'mongoose';

const OtpLoginSchema = new mongoose.Schema(
  {
    email: String,
    code: String,
    expireIn: Number,
  },
  { timestamps: true }
);

export default mongoose.model('otpLogin', OtpLoginSchema);
