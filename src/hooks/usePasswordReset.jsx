import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Custom hook for handling password reset functionality
 * Provides methods for forgot password, reset password, and update password
 */
const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /**
   * Send password reset email
   * @param {string} email - User email address
   * @returns {Promise<boolean>} - Success status
   */
  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/forgot-password`,
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setSuccess(
        response.data.message ||
          'Password reset email sent successfully! Check your inbox.'
      );
      setLoading(false);
      return true;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to send reset email';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  /**
   * Reset password with token
   * @param {string} resetToken - Reset token from email
   * @param {string} password - New password
   * @param {string} passwordConfirm - Password confirmation
   * @returns {Promise<boolean>} - Success status
   */
  const resetPassword = async (resetToken, password, passwordConfirm) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate inputs
      if (!resetToken || !password || !passwordConfirm) {
        throw new Error('All fields are required');
      }

      if (password !== passwordConfirm) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const response = await axios.put(
        `${API_BASE_URL}/auth/reset-password/${resetToken}`,
        {
          password,
          passwordConfirm,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setSuccess(
        response.data.message || 'Password reset successfully! You can now login.'
      );
      setLoading(false);
      return true;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to reset password';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  /**
   * Update password for authenticated user
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} token - JWT authentication token
   * @returns {Promise<boolean>} - Success status
   */
  const updatePassword = async (currentPassword, newPassword, token) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate inputs
      if (!currentPassword || !newPassword) {
        throw new Error('All fields are required');
      }

      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }

      if (currentPassword === newPassword) {
        throw new Error('New password must be different from current password');
      }

      const response = await axios.put(
        `${API_BASE_URL}/auth/update-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data.message || 'Password updated successfully!'
      );
      setLoading(false);
      return true;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to update password';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  /**
   * Clear error and success messages
   */
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    loading,
    error,
    success,
    forgotPassword,
    resetPassword,
    updatePassword,
    clearMessages,
  };
};

export default usePasswordReset;
