// src/pages/SliderManagement.jsx
/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Stack,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Snackbar,
  Alert,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Switch,
  FormControlLabel,
} from '@mui/material';

// ✅ API BASE URL — matches your routes: app.use("/api/slider", ...)
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || 'https://lifestyle-backend-lime.vercel.app/api') + '/slider';

// 🔥 Slider API
const sliderApi = {
  // GET /api/slider — public
  getAll: async () => {
    const res = await fetch(`${API_BASE_URL}/`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    // Server returns: { id, slides: [...], is_active, updated_at }
    // Or { success, data: {...} }
    return data.success ? data.data : data;
  },

  // PATCH /api/slider/toggle
  toggle: async () => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE_URL}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  // POST /api/slider/slides — multipart (file + fields)
  addSlide: async (formData) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE_URL}/slides`, {
      method: 'POST',
      headers: {
        // ⚠️ Do NOT set Content-Type — browser sets multipart boundary
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  // PUT /api/slider/slides/:slideId — multipart
  updateSlide: async (slideId, formData) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE_URL}/slides/${slideId}`, {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  // DELETE /api/slider/slides/:slideId
  deleteSlide: async (slideId) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE_URL}/slides/${slideId}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },
};

// Form defaults
const defaultForm = {
  title: '',
  media_type: 'image',
  media_url: '',
  auto_duration: 5000,
  sort_order: 0,
  number: '',
  media_file: null,
  previewUrl: '',
};

export default function SliderManagement() {
  const [slider, setSlider] = useState(null);
  const [slides, setSlides] = useState([]);
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editForm, setEditForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const addFileRef = useRef(null);
  const editFileRef = useRef(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) setIsAdminAuthenticated(true);
    fetchSlider();
  }, []);

  // ─── Fetch ──────────────────────────────────────────────
  const fetchSlider = async () => {
    setLoading(true);
    try {
      const row = await sliderApi.getAll();
      let list = row?.slides ?? [];
      if (typeof list === 'string') {
        try {
          list = JSON.parse(list);
        } catch {
          list = [];
        }
      }
      setSlider(row || null);
      setSlides(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Fetch error:', err);
      showSnackbar(err.message || 'Failed to fetch slider', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ─── Toggle active ──────────────────────────────────────
  const handleToggleActive = async () => {
    if (!isAdminAuthenticated) {
      return showSnackbar('Admin not authenticated.', 'error');
    }
    setToggling(true);
    try {
      const res = await sliderApi.toggle();
      const row = res?.data || res || {};
      const next =
        typeof row.is_active === 'boolean' ? row.is_active : !slider?.is_active;

      setSlider((s) => ({ ...(s || {}), is_active: next }));
      showSnackbar(`Slider ${next ? 'activated' : 'deactivated'}`);
    } catch (err) {
      showSnackbar(err.message || 'Failed to toggle', 'error');
    } finally {
      setToggling(false);
    }
  };

  // ─── Form Change ────────────────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // ─── File Picker ────────────────────────────────────────
  const handleFilePick = (e, mode) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      showSnackbar('Only image or video files are allowed.', 'error');
      return;
    }

    // 25 MB cap for videos, 5 MB for images
    const maxSize = isVideo ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showSnackbar(
        `File too large. Max ${isVideo ? '25 MB for videos' : '5 MB for images'}.`,
        'error'
      );
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (mode === 'add') {
      setForm((prev) => ({
        ...prev,
        media_file: file,
        previewUrl,
        media_type: isVideo ? 'video' : 'image',
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        media_file: file,
        previewUrl,
        media_type: isVideo ? 'video' : 'image',
      }));
    }
  };

  const resetForm = () => {
    setForm(defaultForm);
    if (addFileRef.current) addFileRef.current.value = '';
  };

  const resetEditForm = () => {
    setEditForm(defaultForm);
    if (editFileRef.current) editFileRef.current.value = '';
  };

  // ─── Build FormData ─────────────────────────────────────
  // Sent as multipart/form-data. Backend uploads `media_file` (if present)
  // to storage and stores the resulting URL as `media_url` inside the JSONB.
  const buildFormData = (data) => {
    const fd = new FormData();
    fd.append('title', (data.title || '').trim());
    fd.append('media_type', data.media_type || 'image');
    fd.append(
      'auto_duration',
      data.media_type === 'video' ? '' : String(data.auto_duration || 5000)
    );
    fd.append('sort_order', String(data.sort_order || 0));
    fd.append('number', data.number || '');

    // Only include media_url if user hasn't picked a new file.
    // When a file IS present, backend replaces media_url with the new upload.
    if (!data.media_file && data.media_url) {
      fd.append('media_url', data.media_url);
    }
    if (data.media_file) {
      fd.append('media_file', data.media_file);
    }
    return fd;
  };

  // ─── CREATE ─────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.title.trim()) {
      return showSnackbar('Slide title is required', 'error');
    }
    if (!form.media_file && !form.media_url) {
      return showSnackbar('Please upload a media file', 'error');
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
      return showSnackbar('Admin not authenticated. Please login again.', 'error');
    }

    setLoading(true);
    try {
      const fd = buildFormData(form);
      const res = await sliderApi.addSlide(fd);

      if (res.success || res.data || res.id) {
        showSnackbar('Slide added successfully!');
        setOpen(false);
        resetForm();
        fetchSlider();
      } else {
        showSnackbar(res.message || 'Error adding slide', 'error');
      }
    } catch (err) {
      console.error('Create error:', err);
      showSnackbar(err.message || 'Server error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── UPDATE ─────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!editForm.title.trim()) {
      return showSnackbar('Slide title is required', 'error');
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
      return showSnackbar('Admin not authenticated. Please login again.', 'error');
    }

    setLoading(true);
    try {
      const fd = buildFormData(editForm);
      const res = await sliderApi.updateSlide(editingId, fd);

      if (res.success || res.data || res.id) {
        showSnackbar('Slide updated successfully!');
        setOpenEdit(false);
        resetEditForm();
        setEditingId(null);
        fetchSlider();
      } else {
        showSnackbar(res.message || 'Error updating slide', 'error');
      }
    } catch (err) {
      console.error('Update error:', err);
      showSnackbar(err.message || 'Server error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── DELETE ─────────────────────────────────────────────
  const handleDelete = async (slideId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    const token = localStorage.getItem('adminToken');
    if (!token) {
      return showSnackbar('Admin not authenticated. Please login again.', 'error');
    }

    setLoading(true);
    try {
      const res = await sliderApi.deleteSlide(slideId);
      if (res.success || res.id || res.data) {
        showSnackbar('Slide deleted successfully!');
        fetchSlider();
      } else {
        showSnackbar(res.message || 'Error deleting slide', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showSnackbar(err.message || 'Server error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Open Edit ──────────────────────────────────────────
  const openEditDialog = (slide) => {
    setEditingId(slide.id);
    setEditForm({
      title: slide.title || '',
      media_type: slide.media_type || 'image',
      media_url: slide.media_url || '',
      auto_duration: slide.auto_duration ?? 5000,
      sort_order: slide.sort_order ?? 0,
      number: slide.number || '',
      media_file: null, // user must pick a new file to replace
      previewUrl: slide.media_url || '', // shows existing media
    });
    setOpenEdit(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdminAuthenticated(false);
    showSnackbar('Admin logged out successfully', 'info');
  };

  // ─── Reusable Form Renderer ─────────────────────────────
  const renderForm = (data, onChange, fileRef, onFileChange, isEdit = false) => (
    <Stack spacing={3} mt={1}>
      <TextField
        label="Slide Title"
        name="title"
        value={data.title}
        onChange={onChange}
        fullWidth
        required
        autoFocus
        placeholder="e.g., FUTURE-READY FASHION"
        helperText="Headline shown on the slide"
      />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Media Type</InputLabel>
            <Select
              name="media_type"
              value={data.media_type}
              onChange={onChange}
              label="Media Type"
            >
              <MenuItem value="image">Image</MenuItem>
              <MenuItem value="video">Video</MenuItem>
            </Select>
            <FormHelperText>
              Image slides auto-advance; videos play in full
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Display Number (optional)"
            name="number"
            value={data.number}
            onChange={onChange}
            fullWidth
            placeholder="01, 02, 03..."
            helperText="Badge number shown on the slide"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {data.media_type === 'image' && (
          <Grid item xs={12} sm={6}>
            <TextField
              label="Auto Duration (ms)"
              name="auto_duration"
              type="number"
              value={data.auto_duration}
              onChange={onChange}
              fullWidth
              helperText="e.g. 5000 = 5 seconds"
              inputProps={{ min: 500, step: 500 }}
            />
          </Grid>
        )}

        <Grid item xs={12} sm={6}>
          <TextField
            label="Sort Order"
            name="sort_order"
            type="number"
            value={data.sort_order}
            onChange={onChange}
            fullWidth
            helperText="Lower numbers appear first"
            inputProps={{ min: 0 }}
          />
        </Grid>
      </Grid>

      {/* Media upload */}
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: 'block', fontWeight: 600 }}
        >
          Slide Media {isEdit && '(leave empty to keep current)'}
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          {/* Preview */}
          <Box
            sx={{
              width: 140,
              height: 100,
              borderRadius: 2,
              border: '2px dashed #e0d9ce',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              bgcolor: '#fafafa',
              flexShrink: 0,
            }}
          >
            {data.previewUrl ? (
              data.media_type === 'video' ? (
                <Box
                  component="video"
                  src={data.previewUrl}
                  muted
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Box
                  component="img"
                  src={data.previewUrl}
                  alt="preview"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )
            ) : (
              <Typography variant="caption" color="text.secondary">
                No media
              </Typography>
            )}
          </Box>

          {/* Upload controls */}
          <Stack spacing={1}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              hidden
              onChange={onFileChange}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => fileRef.current?.click()}
            >
              {data.media_file ? 'Change Media' : 'Choose Media'}
            </Button>
            {data.media_file && (
              <Button
                variant="text"
                size="small"
                color="error"
                onClick={() =>
                  isEdit
                    ? setEditForm((prev) => ({
                        ...prev,
                        media_file: null,
                        previewUrl: prev.media_url || '',
                      }))
                    : setForm((prev) => ({
                        ...prev,
                        media_file: null,
                        previewUrl: '',
                      }))
                }
              >
                Remove New File
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );

  // ─── Derived ────────────────────────────────────────────
  const sortedSlides = [...slides].sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
  );
  const imageCount = slides.filter((s) => s.media_type === 'image').length;
  const videoCount = slides.filter((s) => s.media_type === 'video').length;

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Slider Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your hero slideshow — images, videos, order and timing
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          {isAdminAuthenticated && (
            <Chip
              label="Admin Mode"
              color="primary"
              size="medium"
              onDelete={handleAdminLogout}
            />
          )}
          <Button
            variant="contained"
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
            disabled={loading}
            size="large"
          >
            + Add Slide
          </Button>
        </Stack>
      </Stack>

      {/* STATS CARDS */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#f5f5f5' }}>
            <CardContent>
              <Typography variant="h6" color="primary" fontWeight="bold">
                Slider Status
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mt={1}
              >
                <Chip
                  label={slider?.is_active ? 'ACTIVE' : 'INACTIVE'}
                  color={slider?.is_active ? 'success' : 'default'}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!slider?.is_active}
                      onChange={handleToggleActive}
                      disabled={toggling || !isAdminAuthenticated}
                      color="error"
                    />
                  }
                  label=""
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f0fdf4' }}>
            <CardContent>
              <Typography variant="h6" color="#16a34a" fontWeight="bold">
                Total Slides
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {slides.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fefce8' }}>
            <CardContent>
              <Typography variant="h6" color="#ca8a04" fontWeight="bold">
                Image Slides
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {imageCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#eff6ff' }}>
            <CardContent>
              <Typography variant="h6" color="#2563eb" fontWeight="bold">
                Video Slides
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {videoCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* LIST */}
      <Typography variant="h5" gutterBottom mb={2} fontWeight="bold">
        All Slides
      </Typography>

      {loading && !slides.length ? (
        <Typography textAlign="center" py={4}>
          Loading slides...
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {sortedSlides.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ bgcolor: '#fafafa', textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">
                  No slides yet. Add your first one!
                </Typography>
              </Card>
            </Grid>
          ) : (
            sortedSlides.map((slide, index) => (
              <Grid item xs={12} sm={6} md={4} key={slide.id ?? index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: '0.3s',
                    '&:hover': { boxShadow: 6 },
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Media / fallback */}
                  <Box
                    sx={{
                      position: 'relative',
                      pt: '60%',
                      bgcolor: '#1a1f2e',
                    }}
                  >
                    {slide.media_type === 'image' && slide.media_url ? (
                      <CardMedia
                        component="img"
                        image={slide.media_url}
                        alt={slide.title}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : slide.media_type === 'video' && slide.media_url ? (
                      <Box
                        component="video"
                        src={slide.media_url}
                        muted
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 42,
                          color: '#c8a96e',
                        }}
                      >
                        🎬
                      </Box>
                    )}

                    {/* Number badge */}
                    <Chip
                      label={slide.number || '--'}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        bgcolor: 'rgba(26,31,46,0.85)',
                        color: '#c8a96e',
                        fontWeight: 700,
                      }}
                    />

                    {/* Type badge */}
                    <Chip
                      label={slide.media_type}
                      size="small"
                      color={slide.media_type === 'video' ? 'info' : 'success'}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={2}
                    >
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        gutterBottom
                        noWrap
                        title={slide.title}
                        sx={{ maxWidth: '65%' }}
                      >
                        {slide.title}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => openEditDialog(slide)}
                          sx={{ minWidth: '35px', p: '4px 8px' }}
                          disabled={!isAdminAuthenticated}
                        >
                          ✏️
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(slide.id, slide.title)}
                          sx={{ minWidth: '35px', p: '4px 8px' }}
                          disabled={!isAdminAuthenticated}
                        >
                          🗑️
                        </Button>
                      </Stack>
                    </Stack>

                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Sort Order
                        </Typography>
                        <Typography variant="body2">
                          {slide.sort_order ?? 0}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Duration
                        </Typography>
                        <Typography variant="body2">
                          {slide.auto_duration
                            ? `${slide.auto_duration} ms`
                            : 'Full video'}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* CREATE DIALOG */}
      <Dialog
        open={open}
        onClose={() => !loading && setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Typography variant="h5" fontWeight="bold">
            Add Slide
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Add a new slide to the hero slider
          </Typography>
        </DialogTitle>

        <DialogContent>
          {renderForm(form, handleChange, addFileRef, (e) =>
            handleFilePick(e, 'add')
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button
            onClick={() => setOpen(false)}
            disabled={loading}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading}>
            {loading ? 'Adding...' : 'Add Slide'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog
        open={openEdit}
        onClose={() => !loading && setOpenEdit(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Typography variant="h5" fontWeight="bold">
            Edit Slide
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Update slide information
          </Typography>
        </DialogTitle>

        <DialogContent>
          {renderForm(
            editForm,
            handleEditChange,
            editFileRef,
            (e) => handleFilePick(e, 'edit'),
            true
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button
            onClick={() => setOpenEdit(false)}
            disabled={loading}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={loading}
            color="primary"
          >
            {loading ? 'Updating...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
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
    </Container>
  );
}