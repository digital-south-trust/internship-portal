import User from '../models/User.js';
import dbConnect from '../lib/mongodb.js';

/**
 * Service for handling User business logic.
 * Decouples API routes from database operations.
 */
export const UserService = {
  /**
   * Fetch a user by their ID.
   * @param {string} userId - The MongoDB ObjectId of the user.
   * @returns {Promise<Object|null>} The user document or null if not found.
   */
  async getUserById(userId) {
    await dbConnect();
    return User.findById(userId).lean();
  },

  /**
   * Fetch a user by email.
   * @param {string} email - The email address.
   * @returns {Promise<Object|null>}
   */
  async getUserByEmail(email) {
    await dbConnect();
    return User.findOne({ email }).lean();
  },

  /**
   * Create a new user in the database.
   * @param {Object} userData - Validated user data from Zod.
   * @returns {Promise<Object>} The newly created user document.
   */
  async createUser(userData) {
    await dbConnect();
    const newUser = new User(userData);
    await newUser.save();
    return newUser.toObject();
  },

  /**
   * Update an existing user.
   * @param {string} userId - The MongoDB ObjectId of the user.
   * @param {Object} updateData - Validated update fields.
   * @returns {Promise<Object|null>} The updated user document.
   */
  async updateUser(userId, updateData) {
    await dbConnect();
    return User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).lean();
  },
  
  /**
   * Update user status.
   * @param {string} userId - The MongoDB ObjectId of the user.
   * @param {string} status - New status string.
   * @returns {Promise<Object|null>}
   */
  async updateStatus(userId, status) {
      await dbConnect();
      return User.findByIdAndUpdate(userId, { status }, { new: true }).lean();
  },

  /**
   * Fetch users with pagination and filtering.
   * @param {Object} options
   * @param {number} options.page
   * @param {number} options.limit
   * @param {Object} options.query
   * @returns {Promise<{users: Array, total: number, pages: number}>}
   */
  async getUsersPaginated({ page = 1, limit = 10, query = {}, sort = { createdAt: -1 } }) {
    await dbConnect();
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find(query)
          .select('_id fullName email role track status selectionStatus profilePicture passportPhoto avatarSeed assessmentScore createdAt')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
      User.countDocuments(query)
    ]);

    return {
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };
  }
};
