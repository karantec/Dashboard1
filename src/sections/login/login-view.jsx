/* eslint-disable perfectionist/sort-imports */
// src/sections/login/LoginView.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { setToken, getToken } from 'src/utils/auth';
import { adminLogin } from 'src/services/authService';
import Iconify from 'src/components/iconify';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const NAVY = '#1a1f2e';
const GOLD = '#c8a96e';
const GOLD_DARK = '#b8935a';
const CREAM = '#f7f4ef';
const MUTED = '#7a7060';
const BORDER = '#e0d9ce';

export default function LoginView() {
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await adminLogin(email, password);

      // 👇 Match the new backend response shape:
      // { success: true, message: "...", token: "...", data: { _id, name, email, role } }
      if (!response?.token) {
        setError('Invalid response from server');
        return;
      }

      const admin = response.data;
      if (!admin || admin.role !== 'admin') {
        setError('Unauthorized: Not an admin account');
        return;
      }

      // Save token — used by axios interceptor as `adminToken`
      setToken(response.token);

      // Optional: store admin info for the header/sidebar
      localStorage.setItem('adminUser', JSON.stringify(admin));

      // Redirect to dashboard
      navigate('/', { replace: true });
    } catch (err) {
      // Read message from our backend's error shape: { success, message }
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
      `}</style>

      <Box sx={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
        {/* ── Left Panel ─────────────────────────────────────────────────── */}
        <Box
          sx={{
            width: { xs: 0, md: '45%' },
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 5,
            background: `linear-gradient(160deg, ${GOLD} 0%, ${GOLD_DARK} 40%, #8c6b3a 100%)`,
          position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -60, right: -60,
              width: 220, height: 220,
              border: '2px solid rgba(255,255,255,0.12)',
              borderRadius: '50%',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -40, left: -40,
              width: 160, height: 160,
              border: '2px solid rgba(255,255,255,0.08)',
              borderRadius: '50%',
            },
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.5,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '8px',
              px: 2, py: 1.25,
              width: 'fit-content',
              zIndex: 1,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 9, fontWeight: 300,
                  letterSpacing: 2, color: 'rgba(255,255,255,0.7)',
                  textTransform: 'uppercase',
                }}
              >
                Admin Portal
              </Typography>
            </Box>
          </Box>

          {/* Tagline */}
          <Box sx={{ zIndex: 1 }}>
            <Typography
              sx={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700, fontSize: '2rem',
                color: '#fff', lineHeight: 1.25, mb: 1.5,
              }}
            >
              Premium Print Management
            </Typography>
            <Box sx={{ width: 48, height: 2, background: 'rgba(255,255,255,0.4)', borderRadius: 1, mb: 1.5 }} />
            <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, fontWeight: 300 }}>
              Manage your executive business cards, laminated prints, and marketing
              materials from one unified admin panel.
            </Typography>
          </Box>

          {/* Card Preview Strip */}
          <Box
            sx={{
              zIndex: 1,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              p: 2,
              display: 'flex', alignItems: 'center', gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 40, height: 40,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}
            >
              🖨️
            </Box>
            <Box />
          </Box>
        </Box>

        {/* ── Right Panel (Form) ──────────────────────────────────────────── */}
        <Box
          sx={{
            flex: 1,
            background: CREAM,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 3, md: 5 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 380 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  display: 'inline-block',
                  background: NAVY,
                  color: GOLD,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  px: 1.5, py: 0.5,
                  borderRadius: '20px',
                  mb: 1.5,
                }}
              >
                Admin Access
              </Box>
              <Typography
                sx={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700, fontSize: '1.85rem',
                  color: NAVY, lineHeight: 1.2, mb: 0.5,
                }}
              >
                Welcome back
              </Typography>
              <Typography sx={{ fontSize: 13, color: MUTED, fontWeight: 300 }}>
                Sign in to your administration dashboard
              </Typography>
            </Box>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                {/* Email */}
                <Box>
                  <Typography
                    component="label"
                    sx={{
                      display: 'block', fontSize: 11, fontWeight: 500,
                      letterSpacing: 1, textTransform: 'uppercase',
                      color: MUTED, mb: 0.75,
                    }}
                  >
                    Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: '#fff',
                        borderRadius: '8px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14,
                        color: NAVY,
                        '& fieldset': { borderColor: BORDER, borderWidth: 1.5 },
                        '&:hover fieldset': { borderColor: GOLD_DARK },
                        '&.Mui-focused fieldset': { borderColor: GOLD, borderWidth: 2 },
                      },
                      '& .MuiOutlinedInput-input': { py: 1.5, px: 1.75 },
                    }}
                  />
                </Box>

                {/* Password */}
                <Box>
                  <Typography
                    component="label"
                    sx={{
                      display: 'block', fontSize: 11, fontWeight: 500,
                      letterSpacing: 1, textTransform: 'uppercase',
                      color: MUTED, mb: 0.75,
                    }}
                  >
                    Password
                  </Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    variant="outlined"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                            <Iconify
                              icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'}
                              sx={{ color: MUTED, fontSize: 18 }}
                            />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: '#fff',
                        borderRadius: '8px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14,
                        color: NAVY,
                        '& fieldset': { borderColor: BORDER, borderWidth: 1.5 },
                        '&:hover fieldset': { borderColor: GOLD_DARK },
                        '&.Mui-focused fieldset': { borderColor: GOLD, borderWidth: 2 },
                      },
                      '& .MuiOutlinedInput-input': { py: 1.5, px: 1.75 },
                    }}
                  />
                  <Typography
                    sx={{
                      display: 'block', textAlign: 'right',
                      fontSize: 12, color: GOLD, fontWeight: 500,
                      mt: 0.75, cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Forgot password?
                  </Typography>
                </Box>

                {/* Error */}
                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      background: '#fdf0ef',
                      border: '1px solid #f5c1bb',
                      borderRadius: '8px',
                      fontSize: 13,
                      color: '#a32d2d',
                      '& .MuiAlert-icon': { color: '#a32d2d' },
                    }}
                  >
                    {error}
                  </Alert>
                )}

                {/* Submit */}
                <LoadingButton
                  fullWidth
                  type="submit"
                  loading={loading}
                  sx={{
                    mt: 0.5,
                    py: 1.6,
                    background: NAVY,
                    color: GOLD,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: 1,
                    borderRadius: '8px',
                    textTransform: 'none',
                    '&:hover': { background: '#252d42' },
                    '&:active': { transform: 'scale(0.98)' },
                    '&.MuiLoadingButton-loading': { background: NAVY },
                    '& .MuiLoadingButton-loadingIndicator': { color: GOLD },
                  }}
                >
                  Sign In to Dashboard
                </LoadingButton>
              </Stack>
            </form>
          </Box>
        </Box>
      </Box>
    </>
  );
}