import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 5,
    required: [true, 'Please provide name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide valid email',
    },
  },
  password: {
    type: String,
    minLength: 6,
    required: [true, 'Please provide password'],
    trim: true,
  },
  previousPassword: [],
});
UserSchema.pre('save', async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.previousPassword.push(this.password);
});

UserSchema.methods.createJWT = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
};
UserSchema.methods.comparePassword = async function (pass) {
  return await bcrypt.compare(pass, this.password);
};
UserSchema.methods.checkPasswordHistory = async function (nPassword) {
  let isMatch = false;
  for (let index = 0; index < this.previousPassword.length; index++) {
    let result = await bcrypt.compare(nPassword, this.previousPassword[index]);
    if (result) {
      isMatch = true;
      break;
    }
  }
  return isMatch;
};
export default mongoose.model('User', UserSchema);
