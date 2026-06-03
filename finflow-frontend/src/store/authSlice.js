import { createSlice } from '@reduxjs/toolkit';
import { 
  loginUser, 
  registerUser,
  verifyRegistration, 
  forgotPassword, 
  resetPassword,
  verifyLogin,
  verifyForgotPasswordOtp,
  resendSignupOtp
} from './authActions';

// Initial state with persistent session recovery
const initialState = {
  user: localStorage.getItem('finflow_user') || null,
  token: localStorage.getItem('finflow_token') || null,
  userRole: (localStorage.getItem('finflow_role') || null)?.replace(/^ROLE_/, '') || null,
  isAuthenticated: !!localStorage.getItem('finflow_token'),
  mfaRequired: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.userRole = null;
      state.isAuthenticated = false;
      state.mfaRequired = false;
      localStorage.removeItem('finflow_token');
      localStorage.removeItem('finflow_refresh_token');
      localStorage.removeItem('finflow_user');
      localStorage.removeItem('finflow_role');
    },
    loginAsGuest: (state) => {
      const guestToken = 'guest-demo-session';
      state.user = 'Guest User';
      state.token = guestToken;
      state.userRole = 'GUEST';
      state.isAuthenticated = true;
      state.mfaRequired = false;
      state.loading = false;
      state.error = null;
      localStorage.setItem('finflow_token', guestToken);
      localStorage.setItem('finflow_user', 'Guest User');
      localStorage.setItem('finflow_role', 'GUEST');
      localStorage.removeItem('finflow_refresh_token');
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    const handlePending = (state) => {
      state.loading = true;
      state.error = null;
    };
    
    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };

    builder
      // Async Auth Reducers
      // Login flow
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.mfaRequired = action.payload.mfaRequired;
        if (!action.payload.mfaRequired) {
          state.isAuthenticated = true;
          state.token = action.payload.token;
          state.user = action.payload.username;
          state.userRole = (action.payload.role || 'APPLICANT').replace(/^ROLE_/, '');
        } else {
          state.user = action.payload.username;
        }
      })
      .addCase(loginUser.rejected, handleRejected)
      
      // MFA Verify
      .addCase(verifyLogin.pending, handlePending)
      .addCase(verifyLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.userRole = (action.payload.role || 'APPLICANT').replace(/^ROLE_/, '');
        state.user = action.payload.username;
        state.mfaRequired = false;
      })
      .addCase(verifyLogin.rejected, handleRejected)
      
      // Registration flow
      .addCase(registerUser.pending, handlePending)
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, handleRejected)
      
      // Verification flow
      .addCase(verifyRegistration.pending, handlePending)
      .addCase(verifyRegistration.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyRegistration.rejected, handleRejected)

      // Resend Signup OTP
      .addCase(resendSignupOtp.pending, handlePending)
      .addCase(resendSignupOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendSignupOtp.rejected, handleRejected)
      
      // Forgot Password flow
      .addCase(forgotPassword.pending, handlePending)
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, handleRejected)
      
      // Verify Forgot Password OTP
      .addCase(verifyForgotPasswordOtp.pending, handlePending)
      .addCase(verifyForgotPasswordOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyForgotPasswordOtp.rejected, handleRejected)
      
      // Reset Password flow
      .addCase(resetPassword.pending, handlePending)
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, handleRejected);
  },
});

export const { logout, loginAsGuest, clearError } = authSlice.actions;
export default authSlice.reducer;
