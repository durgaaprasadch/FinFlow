import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../api';
import { jwtDecode } from 'jwt-decode';
import { formatError } from '../utils/format';

/**
 * LOGIN USER THUNK:
 * Handles the primary authentication lifecycle.
 * 1. Calls Auth microservice.
 * 2. Decodes JWT to extract Role and Identity.
 * 3. Synchronizes Redux State with Browser LocalStorage for session persistence.
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await authService.login(credentials);
      const { data } = res.data;
      const { accessToken, refreshToken, mfaRequired } = data;
      
      let role = 'APPLICANT';
      let applicantId = null;
      let userId = null;
      
      if (accessToken && !mfaRequired) {
        try {
          // Decode JWT to extract roles and unique IDs (ApplicantID / UserID)
          const decoded = jwtDecode(accessToken);
          role = (decoded.role || decoded.userRole || 'APPLICANT').replace(/^ROLE_/, '');
          applicantId = decoded.applicantId || decoded.sub;
          userId = decoded.userId || decoded.id;
        } catch {
          // Fallback to raw data if decoding fails
          role = (data.role || 'APPLICANT').replace(/^ROLE_/, '');
        }
        
        localStorage.setItem('finflow_token', accessToken);
        localStorage.setItem('finflow_refresh_token', refreshToken);
        localStorage.setItem('finflow_user', credentials.email);
        localStorage.setItem('finflow_role', role);
        if (applicantId) localStorage.setItem('finflow_applicantId', applicantId);
        if (userId) localStorage.setItem('finflow_userId', userId);
      }
      
      return { 
        token: accessToken, 
        refreshToken, 
        username: credentials.email, 
        mfaRequired, 
        role,
        applicantId,
        userId
      };
    } catch (error) {
      return rejectWithValue(formatError(error));
    }
  }
);

export const verifyLogin = createAsyncThunk(
  'auth/verifyLogin',
  async (data, { rejectWithValue }) => {
    try {
      const res = await authService.verifyLogin(data.email, data.otp);
      const responseData = res.data.data;
      const { accessToken, refreshToken } = responseData;
      
      let role = 'APPLICANT';
      let applicantId = null;
      
      try {
        const decoded = jwtDecode(accessToken);
        role = (decoded.role || decoded.userRole || 'APPLICANT').replace(/^ROLE_/, '');
        applicantId = decoded.applicantId || decoded.sub;
      } catch {
        role = (responseData.role || 'APPLICANT').replace(/^ROLE_/, '');
      }

      localStorage.setItem('finflow_token', accessToken);
      localStorage.setItem('finflow_refresh_token', refreshToken);
      localStorage.setItem('finflow_user', data.email);
      localStorage.setItem('finflow_role', role);
      if (applicantId) localStorage.setItem('finflow_applicantId', applicantId);

      return { token: accessToken, refreshToken, username: data.email, role, applicantId };
    } catch (error) {
      return rejectWithValue(formatError(error));
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const payload = {
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
      };
      const res = await authService.signup(payload);
      return res.data;
    } catch (error) {
      return rejectWithValue(formatError(error));
    }
  }
);


export const verifyRegistration = createAsyncThunk(
  'auth/verifyRegistration',
  async (data, { rejectWithValue }) => {
    try {
      const res = await authService.verifySignup(data.email, data.otp);
      return res.data;
    } catch (error) {
      return rejectWithValue(formatError(error));
    }
  }
);

export const resendSignupOtp = createAsyncThunk(
  'auth/resendSignupOtp',
  async (email, { rejectWithValue }) => {
    try {
      const res = await authService.resendSignupOtp(email);
      return res.data;
    } catch (error) {
      return rejectWithValue(formatError(error));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const res = await authService.forgotPassword(email);
      return res.data;
    } catch (error) {
      return rejectWithValue(formatError(error));
    }
  }
);

export const verifyForgotPasswordOtp = createAsyncThunk(
  'auth/verifyForgotPasswordOtp',
  async (data, { rejectWithValue }) => {
    try {
      const res = await authService.verifyOtp(data.email, data.otp);
      const resetToken = res.data.data?.resetToken || res.data.resetToken;
      return { resetToken };
    } catch (error) {
      return rejectWithValue(formatError(error));
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data, { rejectWithValue }) => {
    try {
      const res = await authService.resetPassword(
        data.resetToken, 
        data.newPassword, 
        data.confirmPassword
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(formatError(error));
    }
  }
);
