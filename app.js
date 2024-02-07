const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');

const bookingRouter = require('./routes/bookingRouter');

const reviewRouter = require('./routes/reviewRouter');
const viewRouter = require('./routes/viewRouter');

const app = express();

// setting up templet engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Global Middlewares

// serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set secutiry HTTP headers
// app.use(helmet());

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100, // max number of reqs from same ip
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, Please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// app.use(express.static(`${__dirname}/public`));

// Test middleWare
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies);
  next();
});

// Routers

// Pug templetes
app.use('/', viewRouter);

// ----- our API
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// handel unhandeled routers
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling Middleware
app.use(globalErrorHandler);

//Start Server
module.exports = app;
