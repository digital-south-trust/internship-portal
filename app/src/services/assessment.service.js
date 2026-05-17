import Exam from '../models/Exam.js';
// import Result from '../models/Result.js'; // Can be uncommented when using Result
import dbConnect from '../lib/mongodb.js';

/**
 * Service for handling Assessments (Exams/Results) business logic.
 */
export const AssessmentService = {
  /**
   * Create a new Exam/Assessment.
   * @param {Object} examData - Validated exam data.
   * @returns {Promise<Object>}
   */
  async createExam(examData) {
    await dbConnect();
    const exam = new Exam(examData);
    await exam.save();
    return exam.toObject();
  },

  /**
   * Fetch exams by track.
   * @param {string} track - The internship track name.
   * @returns {Promise<Array<Object>>}
   */
  async getExamsByTrack(track) {
    await dbConnect();
    return Exam.find({ track, status: { $ne: 'ended' } })
               .sort({ scheduledAt: -1 })
               .lean();
  },

  /**
   * Fetch a specific exam by ID.
   * @param {string} examId 
   * @returns {Promise<Object|null>}
   */
  async getExamById(examId) {
    await dbConnect();
    return Exam.findById(examId).populate('questions').lean();
  },

  /**
   * Submit an assessment, evaluate score, and save result.
   * @param {string} userId - The user who took the exam.
   * @param {string} examId - The exam they took.
   * @param {Array} answers - Formatted answers array.
   * @returns {Promise<Object>} A result object containing success status and score.
   */
  async submitAssessment(userId, examId, answers) {
    await dbConnect();
    
    // Core business logic outline:
    // 1. Fetch exam with populated questions.
    // 2. Compare answers against question correct options.
    // 3. Calculate final score.
    // 4. Save result to Result collection (or similar logic).
    // 5. Update user's `isAssessmentDone` and `assessmentScore` fields.
    
    // Placeholder implementation for Phase 2 decoupling
    return {
      success: true,
      message: "Assessment evaluation logic successfully decoupled.",
      score: 0 
    };
  }
};
