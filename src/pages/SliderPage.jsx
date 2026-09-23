// src/pages/HeroSectionPage.jsx
/* eslint-disable perfectionist/sort-named-imports */
/* eslint-disable react/prop-types */
/* eslint-disable */
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Snackbar,
  Typography,
  Chip,
  TextField,
  Alert,
  Paper,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Tooltip,
  Switch,
  FormControlLabel,
  Stack,
} from '@mui/material';

import { heroSectionService } from 'src/services/heroSectionService';

// ─── Design tokens ──────────────────────────────────────────────
const primaryButtonStyle = {
  bgcolor: '#dc2626',
  color: 'white',
  '&:hover': { bgcolor: '#b91c1c' },
  '&.Mui-disabled': { bgcolor: '#fca5a5', color: 'white' },
};

const secondaryButtonStyle = {
  borderColor: '#dc2626',
  color: '#dc2626',
  '&:hover': {
    borderColor: '#b91c1c',
    color: '#b91c1c',
    bgcolor: 'rgba(220, 38, 38, 0.04)',
  },
};

const NAVY = '#1a1f2e';
const GOLD = '#c8a96e';

// ─── Fields that should NOT be editable from this UI ────────────
// (columns on the row, not keys inside hero_content)
const RESERVED_KEYS = ['id', 'is_active', 'updated_at', 'created_at', 'hero_content'];

// ────────────────────────────────────────────────────────────────
export default function HeroSectionPage() {
  const [hero, setHero] = useState(null);      // full row from server
  const [content, setContent] = useState({});  // hero_content object
  const [isActive, setIsActive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [jsonText, setJsonText] = useState('{}');
  const [jsonError, setJsonError] = useState('');

  const [openReset, setOpenReset] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // ─── Init ─────────────────────────────────────────────
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) setIsAdminAuthenticated(true);
    fetchHero();
  }, []);

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ─── Fetch ────────────────────────────────────────────
  const fetchHero = async () => {
    setLoading(true);
    try {
      const res = await heroSectionService.getHero();
      const row = res?.data || res || {};

      const heroContent =
        row.hero_content && typeof row.hero_content === 'object'
          ? row.hero_content
          : {};

      setHero(row);
      setIsActive(!!row.is_active);
      setContent(heroContent);
      setJsonText(JSON.stringify(heroContent, null, 2));
      setJsonError('');
    } catch (err) {
      console.error('Fetch hero error:', err);
      showSnackbar(
        err.response?.data?.message || err.message || 'Failed to load hero section',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Toggle Active ────────────────────────────────────
  const handleToggleActive = async () => {
    if (!isAdminAuthenticated) {
      return showSnackbar('Admin not authenticated.', 'error');
    }
    setToggling(true);
    try {
      const res = await heroSectionService.toggleActive();
      const row = res?.data || res || {};
      const next = typeof row.is_active === 'boolean' ? row.is_active : !isActive;

      setIsActive(next);
      setHero((h) => ({ ...(h || {}), is_active: next }));
      showSnackbar(`Hero section ${next ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to toggle', 'error');
    } finally {
      setToggling(false);
    }
  };

  // ─── Save (PUT — replace hero_content) ────────────────
  const handleSaveFull = async () => {
    if (!isAdminAuthenticated) {
      return showSnackbar('Admin not authenticated.', 'error');
    }
    const source = activeTab === 1 ? parseJsonSafe() : content;
    if (!source) return;

    if (!source.title || !String(source.title).trim()) {
      return showSnackbar('Hero title is required.', 'error');
    }

    setSaving(true);
    try {
      await heroSectionService.updateHero(stripReserved(source));
      showSnackbar('Hero section saved successfully!');
      fetchHero();
    } catch (e) {
      showSnackbar(
        e.response?.data?.message || 'Failed to save hero section',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── Quick Save (PATCH — merge into hero_content) ─────
  const handleSaveQuick = async () => {
    if (!isAdminAuthenticated) {
      return showSnackbar('Admin not authenticated.', 'error');
    }
    const source = activeTab === 1 ? parseJsonSafe() : content;
    if (!source) return;

    if (!source.title || !String(source.title).trim()) {
      return showSnackbar('Hero title is required.', 'error');
    }

    setSaving(true);
    try {
      await heroSectionService.patchHero(stripReserved(source));
      showSnackbar('Hero section updated (partial).');
      fetchHero();
    } catch (e) {
      showSnackbar(
        e.response?.data?.message || 'Failed to update hero section',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────
  const stripReserved = (obj) => {
    const out = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (!RESERVED_KEYS.includes(k)) out[k] = v;
    });
    return out;
  };

  const parseJsonSafe = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setJsonError('JSON must be an object, e.g. { "title": "..." }');
        return null;
      }
      setJsonError('');
      return parsed;
    } catch (e) {
      setJsonError(`Invalid JSON: ${e.message}`);
      return null;
    }
  };

  const handleResetToServer = () => {
    if (!hero) return;
    const hc =
      hero.hero_content && typeof hero.hero_content === 'object'
        ? hero.hero_content
        : {};
    setContent(hc);
    setJsonText(JSON.stringify(hc, null, 2));
    setJsonError('');
    setOpenReset(false);
    showSnackbar('Form reset to last saved values.');
  };

  // ─── Dynamic key handling ─────────────────────────────
  const updateField = (key, value) =>
    setContent((c) => {
      const next = { ...c, [key]: value };
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });

  const removeField = (key) =>
    setContent((c) => {
      const next = { ...c };
      delete next[key];
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });

  const addField = (key) => {
    const k = key.trim().replace(/\s+/g, '_').toLowerCase();
    if (!k || content[k] !== undefined) return;
    updateField(k, '');
  };

  const handleJsonChange = (text) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setContent(parsed);
        setJsonError('');
      } else {
        setJsonError('JSON must be an object');
      }
    } catch (e) {
      setJsonError(`Invalid JSON: ${e.message}`);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setJsonError('');
    } catch (e) {
      setJsonError(`Cannot format: ${e.message}`);
    }
  };

  // ─── Derived ──────────────────────────────────────────
  // Just the keys that actually exist in hero_content.
  const contentKeys = Object.keys(content);

  const isMultilineValue = (val) =>
    typeof val === 'string' && val.length > 60;

  // ─── Loading ──────────────────────────────────────────
  if (loading && !hero) {
    return (
      <Box
        sx={{
          p: 4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress sx={{ color: '#dc2626' }} />
      </Box>
    );
  }

  // ─── Main ─────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="600" color="#1f2937">
            Hero Section Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Edit the content stored in <code>public_hero_section.hero_content</code>
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {isAdminAuthenticated && <Chip label="Admin Mode" color="primary" />}
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchHero}>🔄</IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: '#fef2f2' }}>
            <Typography variant="caption" color="text.secondary" fontWeight="600">
              HERO STATUS
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mt={1}
            >
              <Chip
                label={isActive ? 'ACTIVE' : 'INACTIVE'}
                color={isActive ? 'success' : 'default'}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={handleToggleActive}
                    disabled={toggling || !isAdminAuthenticated}
                    color="error"
                  />
                }
                label=""
              />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f0fdf4' }}>
            <Typography variant="h4" fontWeight="700" color="#16a34a">
              {contentKeys.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Content Keys
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fefce8' }}>
            <Typography variant="h4" fontWeight="700" color="#ca8a04">
              {hero?.id ?? '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Row ID
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#eff6ff' }}>
            <Typography
              variant="body2"
              fontWeight="700"
              color="#2563eb"
              sx={{ wordBreak: 'break-word' }}
            >
              {hero?.updated_at
                ? new Date(hero.updated_at).toLocaleString()
                : '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Last Updated
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        sx={{ mb: 3 }}
      >
        <Tab label="Content" />
        <Tab label="JSON" />
        <Tab label="Preview" />
      </Tabs>

      {/* ─── TAB 0: Content (only existing keys) ──────── */}
      {activeTab === 0 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="600" mb={1}>
              Hero Content
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Only keys that currently exist in <code>hero_content</code> are
              shown below.
            </Typography>

            {contentKeys.length === 0 ? (
              <Alert severity="info">
                <code>hero_content</code> is empty. Add a key below or edit the
                JSON tab directly.
              </Alert>
            ) : (
              <Stack spacing={3}>
                {contentKeys.map((key) => {
                  const value = content[key];
                  const label = key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                  const isLong = isMultilineValue(value);

                  return (
                    <Box
                      key={key}
                      sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}
                    >
                      <TextField
                        fullWidth
                        label={label}
                        value={
                          typeof value === 'string'
                            ? value
                            : JSON.stringify(value)
                        }
                        onChange={(e) => updateField(key, e.target.value)}
                        required={key === 'title'}
                        multiline={isLong}
                        rows={isLong ? 3 : 1}
                        helperText={`key: ${key}`}
                      />
                      <Tooltip title="Remove this key">
                        <IconButton
                          onClick={() => removeField(key)}
                          sx={{ mt: 1, color: '#dc2626' }}
                          disabled={key === 'title'}
                        >
                          🗑️
                        </IconButton>
                      </Tooltip>
                    </Box>
                  );
                })}
              </Stack>
            )}

            <AddFieldRow existingKeys={contentKeys} onAdd={addField} />

            <Divider sx={{ my: 3 }} />

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="outlined"
                onClick={() => setOpenReset(true)}
                sx={secondaryButtonStyle}
                disabled={saving}
              >
                Reset
              </Button>
              <Button
                variant="outlined"
                onClick={handleSaveQuick}
                sx={secondaryButtonStyle}
                disabled={saving || !isAdminAuthenticated}
              >
                Save (Partial)
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveFull}
                disabled={saving || !isAdminAuthenticated}
                sx={primaryButtonStyle}
              >
                {saving ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              <strong>Save (Partial)</strong> merges only the keys above into{' '}
              <code>hero_content</code> via <code>PATCH</code>.{' '}
              <strong>Save Changes</strong> replaces the entire{' '}
              <code>hero_content</code> object via <code>PUT</code>.{' '}
              <code>is_active</code> is its own column and is only changed by
              the toggle above.
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* ─── TAB 1: Raw JSON ──────────────────────────── */}
      {activeTab === 1 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight="600">
                  Raw hero_content (JSONB)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Edit the exact JSON stored in the{' '}
                  <code>hero_content</code> column
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                onClick={formatJson}
                sx={secondaryButtonStyle}
              >
                Format JSON
              </Button>
            </Box>

            <TextField
              fullWidth
              multiline
              minRows={16}
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              error={Boolean(jsonError)}
              helperText={jsonError || ' '}
              InputProps={{
                sx: {
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
                  fontSize: 13,
                },
              }}
              sx={{
                '& .MuiInputBase-root': { alignItems: 'flex-start' },
              }}
            />

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'flex-end',
                mt: 3,
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="outlined"
                onClick={() => setOpenReset(true)}
                sx={secondaryButtonStyle}
                disabled={saving}
              >
                Reset
              </Button>
              <Button
                variant="outlined"
                onClick={handleSaveQuick}
                sx={secondaryButtonStyle}
                disabled={saving || !isAdminAuthenticated || Boolean(jsonError)}
              >
                Save (Partial)
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveFull}
                disabled={saving || !isAdminAuthenticated || Boolean(jsonError)}
                sx={primaryButtonStyle}
              >
                {saving ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ─── TAB 2: Preview ───────────────────────────── */}
      {activeTab === 2 && (
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            <Box
              sx={{
                position: 'relative',
                minHeight: { xs: 340, md: 480 },
                bgcolor: NAVY,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isActive ? 1 : 0.55,
                overflow: 'hidden',
              }}
            >
              {content.media_type === 'image' && content.media_url && (
                <Box
                  component="img"
                  src={content.media_url}
                  alt={content.title || 'hero'}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.55,
                  }}
                />
              )}

              {content.media_type === 'video' && content.media_url && (
                <Box
                  component="video"
                  src={content.media_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.55,
                  }}
                />
              )}

              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(90deg, rgba(26,31,46,0.85) 0%, rgba(26,31,46,0.4) 60%, rgba(26,31,46,0.15) 100%)',
                }}
              />

              <Box
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  maxWidth: 720,
                  width: '100%',
                  px: { xs: 3, md: 6 },
                  py: 6,
                  color: 'white',
                }}
              >
                {content.subtitle && (
                  <Typography
                    variant="overline"
                    sx={{
                      color: GOLD,
                      letterSpacing: 3,
                      fontWeight: 600,
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    {content.subtitle}
                  </Typography>
                )}

                <Typography
                  variant="h3"
                  fontWeight="700"
                  sx={{ mb: 2, lineHeight: 1.15 }}
                >
                  {content.title || 'Your headline will appear here'}
                </Typography>

                {content.description && (
                  <Typography
                    variant="body1"
                    sx={{ mb: 3, opacity: 0.85, maxWidth: 560 }}
                  >
                    {content.description}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              {!isActive && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Hero is currently <strong>inactive</strong> — it won't show on
                  the storefront.
                </Alert>
              )}

              <Typography variant="subtitle2" fontWeight="600" mb={1}>
                What's stored in hero_content
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  bgcolor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 2,
                  fontSize: 12,
                  overflow: 'auto',
                  m: 0,
                }}
              >
                {JSON.stringify(content, null, 2)}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ─── RESET CONFIRM ───────────────────────────── */}
      <Dialog
        open={openReset}
        onClose={() => setOpenReset(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reset form?</DialogTitle>
        <DialogContent>
          <Typography>
            Discards unsaved changes and restores the last saved{' '}
            <code>hero_content</code>. Does not touch the server.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button
            onClick={() => setOpenReset(false)}
            variant="outlined"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetToServer}
            variant="contained"
            color="error"
            disabled={saving}
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── SNACKBAR ─────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ─── Small helper: add a new key ────────────────────────────────
function AddFieldRow({ existingKeys, onAdd }) {
  const [key, setKey] = useState('');

  const normalized = key.trim().replace(/\s+/g, '_').toLowerCase();
  const taken = existingKeys.includes(normalized);

  const submit = () => {
    if (!normalized || taken) return;
    onAdd(normalized);
    setKey('');
  };

  return (
    <Box sx={{ mt: 3, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
      <TextField
        size="small"
        label="Add new key"
        placeholder="e.g. subtitle"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        error={taken}
        helperText={
          taken
            ? 'That key already exists'
            : 'Any key you want. Stored inside hero_content.'
        }
        sx={{ flex: 1 }}
      />
      <Button
        onClick={submit}
        variant="outlined"
        disabled={!normalized || taken}
        sx={{ ...secondaryButtonStyle, mt: 0.5 }}
      >
        Add
      </Button>
    </Box>
  );
}