import express from 'express';
import { UserControllers } from './user.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from './user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidation } from './user.validation';

const router = express.Router();

export const UserRoutes = router;

router.post(
  '/create-user',
  auth(USER_ROLE.ADMIN),
  validateRequest(UserValidation.createUserValidationSchema),
  UserControllers.userRegister
);
router.get('/', UserControllers.getAllUsers);
router.get('/:id', UserControllers.getSingleUser);
router.post('/follow/:id', auth(USER_ROLE.USER), UserControllers.followUser);
router.post(
  '/unfollow/:id',
  auth(USER_ROLE.USER),
  UserControllers.unfollowUser
);
router.put('/block/:userId', auth(USER_ROLE.ADMIN), UserControllers.blockUser);
router.delete(
  '/delete/:userId',
  auth(USER_ROLE.ADMIN),
  UserControllers.deleteUser
);

router.put(
  '/update/:userId',
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  UserControllers.updateUser
);

// Stripe Payment Routes
router.post(
  '/create-checkout-session',
  UserControllers.createCheckoutSessionController
);
