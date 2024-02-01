const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invaild ${err.path}: ${err.value}.`;
  return new AppError(message, 400); // 400 = bad request
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  //console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handelJWTError = () =>
  new AppError('Invaild token, Please log in again!', 401);

const handelJWTExpired = () =>
  new AppError('Your token has Expired! Please log in again', 401);

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // Rendered Website
  console.error('ERROR!!', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    // msg: 'please try again later.',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // a) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or other unknown error: don't leak error details
    //1) Log error
    console.error('ERROR!!', err);
    //2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // b) Renderd website
  //A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      // msg: 'please try again later.',
      msg: err.message,
    });
  }
  // B) Programming or other unknown error: don't leak error details
  //1) Log error
  console.error('ERROR!!', err);
  //2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  //console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err, name: err.name, message: err.message }; // deconstruction
    //console.log(error.message);

    if (error.name === 'CastError') error = handleCastErrorDB(error);

    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handelJWTError();
    if (error.name === 'TokenExpiredError') error = handelJWTExpired();

    sendErrorProd(error, req, res);
  }
};
