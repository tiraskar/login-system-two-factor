import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema(
  {
    email: String,
    code: String,
    expireIn: Number,
  },
  { timestamps: true }
);

export default mongoose.model('otp', OtpSchema);
