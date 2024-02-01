const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true,
    lowerCase: true,
    validate: [validator.isEmail, 'Please provide a valid email!'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password!'],
    validate: {
      // This only works on CREATE and SAVE !!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the Same!',
    },
  },
  passwordChangedAt: Date,
  // for reset fogotten password
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actully modified
  if (!this.isDirectModified('password')) return next();

  // Hash ths password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // delete the PasswordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// setting filter 'query middleware' to get only active: true Users
userSchema.pre(/^find/, function (next) {
  // this points to current query
  this.find({ active: { $ne: false } });
  next();
});

// creating fuction to check if password is correct or not, use it in authController
userSchema.methods.correctPassword = async function (
  candidatePassword, // => password send in login request not hashed
  userPassword, // => password in the database hashed
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// check if password has changed after logging in
userSchema.methods.changesPasswordAfter = function (JWTTimestamp) {
  // if passwordChagedAt exists that means the password has changed
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp; // time token created < time password changed
  }

  // false means NOt changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // unencrypted reset token that we will send in email
  const resetToken = crypto.randomBytes(32).toString('hex');

  // encrypted reset token that we will store in our database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
