/* eslint-disable import/no-extraneous-dependencies */
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`
  await new Email(newUser,url).sendWelcome()
  createSendToken(newUser, 201, res);
});

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Emailid or Password', 401));
  }

  createSendToken(user, 200, res);
};

exports.logout=(req,res)=>{
  res.cookie('jwt','loggedout',{
    expires:new Date(Date.now()+10*1000),
    httpOnly:true
  })
  res.status(200).json({status:'success'})
}

exports.protect = catchAsync(async (req, res, next) => {
  // 1.Get token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('You are not logged in !Please login', 401));
  }
  // 2.verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3.check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('This User no Longer exists', 401));
  }

  // 4.check if the user changed password after the token issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again', 401)
    );
  }

  // Grant Access to Protected Route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission for this action', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1.Get User based on the emailid
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user exist with this email id', 404));
  }
  // 2.Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3.Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  try {
    await new Email(user,resetURL).sendPasswordReset()

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await User.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email, Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1.Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2.If token has not expired and user exists, save Password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3.Update changedPasswordAt property for the user
  // 4.Log the user in,send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1.Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2.check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  // 3.update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4.Log user in, send JWT
  createSendToken(user, 200, res);
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1.verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2.check if the user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3.check if the user changed password after the token issued
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a Logged in user
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
