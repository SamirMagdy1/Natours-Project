const express = require('express');
const userControllers = require('../controllers/userController');
const authControllers = require('../controllers/authController');

const router = express.Router();

// free to everyone
router.post('/signup', authControllers.signup);
router.post('/login', authControllers.login);
router.get('/logout', authControllers.logout);

router.post('/forgotPassword', authControllers.forgotPassword);
router.patch('/resetPassword/:token', authControllers.resetPassword);

// all below Must be authunticated
router.use(authControllers.protect);
// any route "middleware" comes after this line will be protect

router.patch('/updateMyPassword', authControllers.updatePassword);

router.get(
  '/me',
  userControllers.getMe, // to set id in params "faking"
  userControllers.getUser, // to get the user by id in params
);
router.patch(
  '/updateMe',
  userControllers.uploadUserPhoto,
  userControllers.resizeUserPhoto,
  userControllers.updateMe,
);
router.delete('/deleteMe', userControllers.deleteMe);

router.use(authControllers.restrictTo('admin'));

router
  .route('/')
  .get(userControllers.getAllUsers)
  .post(userControllers.createUser);

router
  .route('/:id')
  .get(userControllers.getUser)
  .patch(userControllers.updateUser)
  .delete(userControllers.deleteUser);

module.exports = router;
