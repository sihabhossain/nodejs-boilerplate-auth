import Stripe from 'stripe';
import { QueryBuilder } from '../../builder/QueryBuilder';
import { UserSearchableFields } from './user.constant';
import { TUser } from './user.interface';
import { User } from './user.model';
import config from '../../config';

const createUser = async (payload: TUser) => {
  const user = await User.create(payload);

  return user;
};

const getAllUsersFromDB = async (query: Record<string, unknown>) => {
  const users = new QueryBuilder(User.find(), query)
    .fields()
    .paginate()
    .sort()
    .filter()
    .search(UserSearchableFields);

  const result = await users.modelQuery;

  return result;
};

const getSingleUserFromDB = async (id: string) => {
  const user = await User.findById(id);

  return user;
};

const followUser = async (followerId: string, followingId: string) => {
  // Check if the follower is already following the following user
  const alreadyFollowing = await User.findOne({
    _id: followerId,
    following: followingId,
  });

  if (alreadyFollowing) {
    throw new Error('You are already following this user.');
  }

  // Increment followersCount for the following user and add followerId to their followers list
  const followedUser = await User.findByIdAndUpdate(
    followingId,
    {
      $inc: { followersCount: 1 },
      $addToSet: { followers: followerId }, // Ensure no duplicates
    },
    { new: true }
  );

  // Increment followingCount for the follower user and add followingId to their following list
  const followerUser = await User.findByIdAndUpdate(
    followerId,
    {
      $inc: { followingCount: 1 },
      $addToSet: { following: followingId }, // Ensure no duplicates
    },
    { new: true }
  );

  if (!followerUser || !followedUser) {
    throw new Error('Error updating follower/following data');
  }

  return { followedUser, followerUser };
};

const unfollowUser = async (followerId: string, followingId: string) => {
  // Check if the user is actually following
  const isFollowing = await User.exists({
    _id: followerId,
    following: followingId,
  });

  if (!isFollowing) {
    throw new Error('You are not following this user');
  }

  // Decrement followersCount for the user being unfollowed (followingId)
  // Remove the follower (followerId) from the user's followers array
  const unfollowedUser = await User.findByIdAndUpdate(
    followingId,
    {
      $inc: { followersCount: -1 },
      $pull: { followers: followerId },
    },
    { new: true }
  );

  // Decrement followingCount for the user who unfollows (followerId)
  // Remove the followed user (followingId) from the follower's following array
  const unfollowerUser = await User.findByIdAndUpdate(
    followerId,
    {
      $inc: { followingCount: -1 },
      $pull: { following: followingId },
    },
    { new: true }
  );

  return { unfollowedUser, unfollowerUser };
};

const blockUser = async (userId: string) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { isBlocked: true },
    { new: true }
  );

  return updatedUser;
};

const deleteUser = async (userId: string) => {
  const deletedUser = await User.findByIdAndDelete(userId);
  return deletedUser;
};

const updateUser = async (userId: string, updateData: Partial<TUser>) => {
  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true, // Return the updated document
    runValidators: true, // Ensure that validation rules are respected
  });

  return updatedUser;
};

const stripeSecretKey = config.stripe_secret_key;

if (!stripeSecretKey) {
  throw new Error('Stripe secret key is not defined in environment variables.');
}

const stripe = new Stripe(stripeSecretKey);

const createCheckoutSession = async (payload: { priceId: string }) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: payload.priceId,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${config.stripe_success_url}`,
    cancel_url: `${config.stripe_cancel_url}`,
  });

  return session;
};

export const UserServices = {
  createUser,
  getAllUsersFromDB,
  getSingleUserFromDB,
  followUser,
  unfollowUser,
  blockUser,
  deleteUser,
  updateUser,
  createCheckoutSession,
};
