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
  IconButton,
} from '@mui/material';

// ✅ API BASE URL — uses env var with localhost fallback
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || 'https://lifestyle-backend-lime.vercel.app/api') + '/category';

// 🔥 Category API
const categoryApi = {
  // GET all categories
  getAll: async () => {
    const res = await fetch(API_BASE_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    if (data.success && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  },

  // POST — create (multipart/form-data with image file)
  create: async (formData) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        // ⚠️ Do NOT set Content-Type — browser sets multipart boundary automatically
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

  // PUT — update (multipart/form-data)
  update: async (id, formData) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE_URL}/${id}`, {
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

  // DELETE
  delete: async (id) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE_URL}/${id}`, {
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
  name: '',
  display_order: 0,
  image: null,
  previewUrl: '',
};

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
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
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const addFileRef = useRef(null);
  const editFileRef = useRef(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) setIsAdminAuthenticated(true);
    fetchCategories();
  }, []);

  // ─── Fetch ──────────────────────────────────────────────
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryApi.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch error:', err);
      showSnackbar(err.message || 'Failed to fetch categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ─── Form Change Handlers ───────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleFilePick = (e, mode) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const okType =
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type) ||
      /\.(jpg|jpeg|png|webp)$/i.test(file.name);
    if (!okType) {
      showSnackbar('Only JPG, PNG, or WebP images are allowed.', 'error');
      return;
    }

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showSnackbar('Image must be under 5 MB.', 'error');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (mode === 'add') {
      setForm((prev) => ({ ...prev, image: file, previewUrl }));
    } else {
      setEditForm((prev) => ({ ...prev, image: file, previewUrl }));
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
  const buildFormData = (data) => {
    const fd = new FormData();
    fd.append('name', (data.name || '').trim());
    fd.append('display_order', String(data.display_order || 0));
    if (data.image) fd.append('image', data.image);
    return fd;
  };

  // ─── CREATE ─────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name.trim()) {
      return showSnackbar('Category name is required', 'error');
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
      return showSnackbar('Admin not authenticated. Please login again.', 'error');
    }

    setLoading(true);
    try {
      const fd = buildFormData(form);
      const res = await categoryApi.create(fd);

      if (res.success || res.data || res._id) {
        showSnackbar('Category created successfully!');
        setOpen(false);
        resetForm();
        fetchCategories();
      } else {
        showSnackbar(res.message || 'Error creating category', 'error');
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
    if (!editForm.name.trim()) {
      return showSnackbar('Category name is required', 'error');
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
      return showSnackbar('Admin not authenticated. Please login again.', 'error');
    }

    setLoading(true);
    try {
      const fd = buildFormData(editForm);
      const res = await categoryApi.update(editingId, fd);

      if (res.success || res.data || res._id) {
        showSnackbar('Category updated successfully!');
        setOpenEdit(false);
        resetEditForm();
        setEditingId(null);
        fetchCategories();
      } else {
        showSnackbar(res.message || 'Error updating category', 'error');
      }
    } catch (err) {
      console.error('Update error:', err);
      showSnackbar(err.message || 'Server error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── DELETE ─────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    const token = localStorage.getItem('adminToken');
    if (!token) {
      return showSnackbar('Admin not authenticated. Please login again.', 'error');
    }

    setLoading(true);
    try {
      const res = await categoryApi.delete(id);
      if (res.success || res._id || res.data) {
        showSnackbar('Category deleted successfully!');
        fetchCategories();
      } else {
        showSnackbar(res.message || 'Error deleting category', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showSnackbar(err.message || 'Server error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Open Edit ──────────────────────────────────────────
  const openEditDialog = (cat) => {
    setEditingId(cat._id);
    setEditForm({
      name: cat.name || '',
      display_order: cat.display_order ?? 0,
      image: null, // user must pick a new file to replace
      previewUrl: cat.image || '', // shows existing image
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
        label="Category Name"
        name="name"
        value={data.name}
        onChange={onChange}
        fullWidth
        required
        autoFocus
        placeholder="e.g., Gift Items"
        helperText="Name shown to customers"
      />

      <TextField
        label="Display Order"
        name="display_order"
        type="number"
        value={data.display_order}
        onChange={onChange}
        fullWidth
        helperText="Lower numbers appear first"
        inputProps={{ min: 0 }}
      />

      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: 'block', fontWeight: 600 }}
        >
          Category Image {isEdit && '(leave empty to keep current)'}
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          {/* Preview */}
          <Box
            sx={{
              width: 110,
              height: 110,
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
              <Box
                component="img"
                src={data.previewUrl}
                alt="preview"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                No image
              </Typography>
            )}
          </Box>

          {/* Upload controls */}
          <Stack spacing={1}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onFileChange}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => fileRef.current?.click()}
            >
              {data.image ? 'Change Image' : 'Choose Image'}
            </Button>
            {data.image && (
              <Button
                variant="text"
                size="small"
                color="error"
                onClick={() =>
                  isEdit
                    ? setEditForm((prev) => ({
                        ...prev,
                        image: null,
                        previewUrl: '',
                      }))
                    : setForm((prev) => ({
                        ...prev,
                        image: null,
                        previewUrl: '',
                      }))
                }
              >
                Remove
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );

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
            Categories
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your product categories
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
            + Add Category
          </Button>
        </Stack>
      </Stack>

      {/* STATS CARD */}
      <Card sx={{ mb: 4, bgcolor: '#f5f5f5' }}>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="h6" color="primary" fontWeight="bold">
                Total Categories
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {categories.length}
              </Typography>
            </Box>
            <Chip
              label="Active"
              color="success"
              size="medium"
              sx={{ fontSize: '1rem', py: 2, px: 1 }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* LIST */}
      <Typography variant="h5" gutterBottom mb={2} fontWeight="bold">
        All Categories
      </Typography>

      {loading && !categories.length ? (
        <Typography textAlign="center" py={4}>
          Loading categories...
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {categories.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ bgcolor: '#fafafa', textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">
                  No categories yet. Add your first one!
                </Typography>
              </Card>
            </Grid>
          ) : (
            categories.map((cat, index) => (
              <Grid item xs={12} sm={6} md={4} key={cat._id || index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: '0.3s',
                    '&:hover': { boxShadow: 6 },
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Image / fallback */}
                  <Box
                    sx={{
                      position: 'relative',
                      pt: '60%',
                      bgcolor: '#f5f5f5',
                    }}
                  >
                    {cat.image ? (
                      <CardMedia
                        component="img"
                        image={cat.image}
                        alt={cat.name}
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
                          fontWeight: 700,
                          color: '#c8a96e',
                          bgcolor: '#1a1f2e',
                        }}
                      >
                        {cat.name?.charAt(0)?.toUpperCase() || '?'}
                      </Box>
                    )}

                    {/* Order badge */}
                    <Chip
                      label={`#${cat.display_order ?? 0}`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(26,31,46,0.85)',
                        color: '#c8a96e',
                        fontWeight: 700,
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
                        title={cat.name}
                      >
                        {cat.name}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => openEditDialog(cat)}
                          sx={{ minWidth: '35px', p: '4px 8px' }}
                          disabled={!isAdminAuthenticated}
                        >
                          ✏️
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(cat._id, cat.name)}
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
                          Display Order
                        </Typography>
                        <Typography variant="body2">
                          {cat.display_order ?? 0}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Created
                        </Typography>
                        <Typography variant="body2">
                          {cat.created_at
                            ? new Date(cat.created_at).toLocaleDateString(
                                'en-IN'
                              )
                            : '—'}
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
            Add Category
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Create a new category for your products
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
            {loading ? 'Creating...' : 'Create Category'}
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
            Edit Category
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Update category information
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