const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm a password'],
    validate: {
      // This only works on CREATE andSAVE !!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password are not the same!',
    },
  },
  passwordChangedAt: { type: Date },
});

// Here a preSave middleweare before recording in the DB
userSchema.pre('save', async function (next) {
  // Only run the function if password was modified
  if (!this.isModified('password')) return next();
  // Hash the password with cost of 12 (using npm bcryptjs)
  this.password = await bcrypt.hash(this.password, 12);
  // Delete the passwordConfirm before sending it to the DB
  this.passwordConfirm = undefined;
  next();
});

// Instance methods which is disponible everywhere (here return true or false):
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changesPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimeStamp;
  }
  // false means NOT changes
  return false;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
