import Ambassador from '../models/Ambassador.js';
import dbConnect from '../lib/mongodb.js';

/**
 * Service for handling Ambassador business logic.
 */
export const AmbassadorService = {
  /**
   * Fetch an ambassador by referral code.
   * @param {string} referralCode - The unique referral code.
   * @returns {Promise<Object|null>}
   */
  async getByReferralCode(referralCode) {
    await dbConnect();
    return Ambassador.findOne({ referralCode }).lean();
  },

  /**
   * Fetch an ambassador by ID.
   * @param {string} ambassadorId 
   * @returns {Promise<Object|null>}
   */
  async getAmbassadorById(ambassadorId) {
    await dbConnect();
    return Ambassador.findById(ambassadorId).lean();
  },

  /**
   * Create a new ambassador account.
   * @param {Object} ambassadorData - Validated ambassador data.
   * @returns {Promise<Object>}
   */
  async createAmbassador(ambassadorData) {
    await dbConnect();
    const newAmbassador = new Ambassador(ambassadorData);
    await newAmbassador.save();
    return newAmbassador.toObject();
  },

  /**
   * Increment referral usage statistics and add earnings.
   * @param {string} ambassadorId - The MongoDB ObjectId.
   * @param {number} earningsAmount - The commission earned.
   * @returns {Promise<Object|null>} The updated ambassador document.
   */
  async recordReferral(ambassadorId, earningsAmount) {
    await dbConnect();
    return Ambassador.findByIdAndUpdate(
      ambassadorId,
      { 
        $inc: { userCount: 1, earnings: earningsAmount } 
      },
      { new: true }
    ).lean();
  }
};
