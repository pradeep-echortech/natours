/* eslint-disable import/no-useless-path-segments */
const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const message = 'There is already a data exist with this name';
  return new AppError(message, 400);
};

const handleValidatorErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid inputs :${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid Token! Please login again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your Token has expired! Please login again', 401);

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
      // errorName:err.name,
    });
  } else {
    // RENDERD WEBSITE
    res.status(err.statusCode).render('error', {
      title: 'Something went Wrong!',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOpertaional) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    console.log('Error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
  // RENDERED WEBSITE
  if (err.isOpertaional) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  console.log('Error:', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went Wrong!',
    msg: 'Please try again Later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // let error = { ...err };
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    if (err.name === 'ValidationError') err = handleValidatorErrorDB(err);
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();
    sendErrorProd(err, req, res);
  }
};
