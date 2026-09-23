// src/pages/ProductData.jsx
/* eslint-disable react/prop-types */
/* eslint-disable */
import { Formik, Form } from 'formik';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  TextField,
  Typography,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Chip,
  Autocomplete,
  CircularProgress,
  Divider,
  Stack,
  Tooltip,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
} from '@mui/material';
import { MdEdit, MdDelete, MdAdd, MdRemove, MdInfo } from 'react-icons/md';
import { getCategories } from 'src/services/categoryService';
import {
  getProduct,
  deleteProduct,
  toggleProductStatus,
} from 'src/services/ProductService';

// ⚠️ Field name for file uploads must match the multer config in
// middleware/productUpload.js (e.g. upload.array('images', N))
const FILE_FIELD = 'images';

// Base URL for the product API (matches app.use("/api/product", ...))
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api') + '/product';

// ─── Static options ───────────────────────────────────────────────
const CUSTOMIZATION_TYPES = [
  'radio',
  'checkbox',
  'dropdown',
  'text',
  'textarea',
  'file',
];

// ─── Empty shapes (match backend expectations) ────────────────────
const emptyCustomization = {
  id: '',
  label: '',
  type: 'radio',
  options: [],
  placeholder: '',
  required: false,
  multiple: false,
  files: [],
  value: null,
};

const emptySpecification = { key: '', value: '' };

const emptyOffer = {
  title: '',
  code: '',
  discountPercent: 0,
  active: true,
  expiryDate: '',
  wholesaleApplicable: false,
};

// ─── Button styles ────────────────────────────────────────────────
const redButtonStyle = {
  bgcolor: '#dc2626',
  color: 'white',
  '&:hover': { bgcolor: '#b91c1c' },
};

const redOutlinedButtonStyle = {
  color: '#dc2626',
  borderColor: '#dc2626',
  '&:hover': { borderColor: '#b91c1c', bgcolor: 'rgba(220,38,38,0.04)' },
};

// ─────────────────────────────────────────────────────────────────
// Media Builder — Local preview + real file upload via FormData
// ─────────────────────────────────────────────────────────────────
function MediaBuilder({
  existingMedia,
  setExistingMedia,
  newFiles,
  setNewFiles,
  uploading,
  setUploading,
  showSnackbar,
}) {
  const fileInputRef = useRef(null);

  const handleFilePick = (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    const accepted = [];
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        showSnackbar(`Skipped "${file.name}" — only images or videos`, 'error');
        continue;
      }
      const maxSize = isVideo ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showSnackbar(
          `"${file.name}" is too large (max ${isVideo ? '25MB' : '5MB'})`,
          'error'
        );
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length) {
      setNewFiles((prev) => [...prev, ...accepted]);
      showSnackbar(`${accepted.length} file(s) ready to upload`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeExisting = (i) =>
    setExistingMedia((prev) => prev.filter((_, idx) => idx !== i));

  const removeNew = (i) =>
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" color="black" gutterBottom>
        Media (Images &amp; Videos)
      </Typography>

      <Box display="flex" gap={2} mb={2}>
        <Button
          component="label"
          variant="outlined"
          disabled={uploading}
          sx={redOutlinedButtonStyle}
          size="small"
        >
          + Add Images / Videos
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            accept="image/*,video/*"
            onChange={handleFilePick}
          />
        </Button>
        {uploading && <CircularProgress size={24} />}
      </Box>

      {/* Existing media (already on server) */}
      {existingMedia.length > 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            On server ({existingMedia.length})
          </Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {existingMedia.map((m, i) => (
              <Grid item xs={4} key={`ex-${i}`}>
                <Box position="relative">
                  {m.type === 'video' ? (
                    <Box
                      component="video"
                      src={m.url}
                      muted
                      sx={{
                        width: '100%',
                        height: 90,
                        borderRadius: 1,
                        objectFit: 'cover',
                        bgcolor: '#1f2937',
                      }}
                    />
                  ) : (
                    <img
                      src={m.url}
                      alt=""
                      style={{
                        width: '100%',
                        height: 90,
                        objectFit: 'cover',
                        borderRadius: 6,
                      }}
                    />
                  )}
                  <Chip
                    label={m.type}
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      fontSize: 10,
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeExisting(i)}
                    sx={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      bgcolor: 'white',
                      color: '#dc2626',
                      '&:hover': { bgcolor: '#fee2e2' },
                    }}
                  >
                    ✕
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Pending new files (not yet uploaded) */}
      {newFiles.length > 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Ready to upload ({newFiles.length})
          </Typography>
          <Grid container spacing={1}>
            {newFiles.map((file, i) => {
              const isVideo = file.type.startsWith('video/');
              const previewUrl = URL.createObjectURL(file);
              return (
                <Grid item xs={4} key={`new-${i}`}>
                  <Box position="relative">
                    {isVideo ? (
                      <Box
                        component="video"
                        src={previewUrl}
                        muted
                        sx={{
                          width: '100%',
                          height: 90,
                          borderRadius: 1,
                          objectFit: 'cover',
                          bgcolor: '#1f2937',
                        }}
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt=""
                        style={{
                          width: '100%',
                          height: 90,
                          objectFit: 'cover',
                          borderRadius: 6,
                        }}
                      />
                    )}
                    <Chip
                      label={isVideo ? 'video' : 'image'}
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 4,
                        left: 4,
                        bgcolor: 'rgba(220,38,38,0.85)',
                        color: 'white',
                        fontSize: 10,
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeNew(i)}
                      sx={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        bgcolor: 'white',
                        color: '#dc2626',
                        '&:hover': { bgcolor: '#fee2e2' },
                      }}
                    >
                      ✕
                    </IconButton>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      {existingMedia.length === 0 && newFiles.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          py={2}
        >
          No media yet. Click "Add Images / Videos" to start.
        </Typography>
      )}
    </Paper>
  );
}

// ─────────────────────────────────────────────────────────────────
// Specifications Builder
// ─────────────────────────────────────────────────────────────────
function SpecificationsBuilder({ specifications, setFieldValue }) {
  const add = () =>
    setFieldValue('specifications', [...specifications, { ...emptySpecification }]);
  const remove = (i) =>
    setFieldValue(
      'specifications',
      specifications.filter((_, idx) => idx !== i)
    );
  const update = (i, key, value) => {
    const updated = specifications.map((s, idx) =>
      idx === i ? { ...s, [key]: value } : s
    );
    setFieldValue('specifications', updated);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" color="black">
          Specifications
        </Typography>
        <Button
          startIcon={<MdAdd />}
          onClick={add}
          size="small"
          variant="outlined"
          sx={redOutlinedButtonStyle}
        >
          Add Specification
        </Button>
      </Box>
      {specifications.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
          No specifications yet.
        </Typography>
      )}
      {specifications.map((spec, i) => (
        <Box key={i} display="flex" gap={2} mb={2}>
          <TextField
            label="Key"
            size="small"
            fullWidth
            value={spec.key}
            onChange={(e) => update(i, 'key', e.target.value)}
            placeholder="e.g., Material"
          />
          <TextField
            label="Value"
            size="small"
            fullWidth
            value={spec.value}
            onChange={(e) => update(i, 'value', e.target.value)}
            placeholder="e.g., Premium Paper"
          />
          <IconButton color="error" onClick={() => remove(i)}>
            <MdDelete />
          </IconButton>
        </Box>
      ))}
    </Paper>
  );
}

// ─────────────────────────────────────────────────────────────────
// Features Builder (array of strings)
// ─────────────────────────────────────────────────────────────────
function FeaturesBuilder({ features, setFieldValue }) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim();
    if (!val) return;
    setFieldValue('features', [...features, val]);
    setInput('');
  };

  const remove = (i) =>
    setFieldValue(
      'features',
      features.filter((_, idx) => idx !== i)
    );

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" color="black" gutterBottom>
        Features
      </Typography>
      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="Add a feature"
          size="small"
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="e.g., Handcrafted, Eco-friendly"
        />
        <Button
          variant="outlined"
          onClick={add}
          disabled={!input.trim()}
          sx={redOutlinedButtonStyle}
        >
          Add
        </Button>
      </Box>
      {features.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
          No features added yet.
        </Typography>
      )}
      <Box display="flex" gap={1} flexWrap="wrap">
        {features.map((f, i) => (
          <Chip
            key={i}
            label={f}
            onDelete={() => remove(i)}
            sx={{ bgcolor: '#fee2e2', color: '#dc2626' }}
          />
        ))}
      </Box>
    </Paper>
  );
}

// ─────────────────────────────────────────────────────────────────
// Customizations Builder
// ─────────────────────────────────────────────────────────────────
function CustomizationBuilder({ customizations, setFieldValue }) {
  const add = () =>
    setFieldValue('customizations', [
      ...customizations,
      { ...emptyCustomization, id: `field_${Date.now()}` },
    ]);
  const remove = (i) =>
    setFieldValue(
      'customizations',
      customizations.filter((_, idx) => idx !== i)
    );
  const update = (i, key, value) => {
    const updated = customizations.map((c, idx) =>
      idx === i ? { ...c, [key]: value } : c
    );
    setFieldValue('customizations', updated);
  };
  const addOption = (i) => {
    const updated = customizations.map((c, idx) =>
      idx === i
        ? { ...c, options: [...(c.options || []), { label: '', priceAdjustment: 0 }] }
        : c
    );
    setFieldValue('customizations', updated);
  };
  const updateOption = (i, oi, field, value) => {
    const updated = customizations.map((c, idx) =>
      idx === i
        ? {
            ...c,
            options: c.options.map((o, oidx) =>
              oidx === oi
                ? {
                    ...o,
                    [field]:
                      field === 'priceAdjustment'
                        ? parseFloat(value) || 0
                        : value,
                  }
                : o
            ),
          }
        : c
    );
    setFieldValue('customizations', updated);
  };
  const removeOption = (i, oi) => {
    const updated = customizations.map((c, idx) =>
      idx === i
        ? { ...c, options: c.options.filter((_, oidx) => oidx !== oi) }
        : c
    );
    setFieldValue('customizations', updated);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" color="black">
          Customizations
        </Typography>
        <Button
          startIcon={<MdAdd />}
          onClick={add}
          size="small"
          variant="outlined"
          sx={redOutlinedButtonStyle}
        >
          Add Field
        </Button>
      </Box>

      {customizations.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
          No customization fields yet. Click "Add Field" to start.
        </Typography>
      )}

      {customizations.map((c, i) => (
        <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="subtitle2" color="#dc2626">
              Field {i + 1}
            </Typography>
            <IconButton size="small" color="error" onClick={() => remove(i)}>
              <MdDelete />
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="Field ID"
                fullWidth
                size="small"
                value={c.id}
                onChange={(e) => update(i, 'id', e.target.value)}
                helperText="e.g. size, finish"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Label"
                fullWidth
                size="small"
                value={c.label}
                onChange={(e) => update(i, 'label', e.target.value)}
                helperText="e.g. Card Size"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                select
                label="Type"
                fullWidth
                size="small"
                value={c.type}
                onChange={(e) => update(i, 'type', e.target.value)}
              >
                {CUSTOMIZATION_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={c.required || false}
                    onChange={(e) => update(i, 'required', e.target.checked)}
                    color="error"
                  />
                }
                label="Required"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={c.multiple || false}
                    onChange={(e) => update(i, 'multiple', e.target.checked)}
                    color="error"
                  />
                }
                label="Multiple Selection"
              />
            </Grid>

            {['text', 'textarea'].includes(c.type) && (
              <Grid item xs={12}>
                <TextField
                  label="Placeholder"
                  fullWidth
                  size="small"
                  value={c.placeholder}
                  onChange={(e) => update(i, 'placeholder', e.target.value)}
                />
              </Grid>
            )}

            {['radio', 'checkbox', 'dropdown'].includes(c.type) && (
              <Grid item xs={12}>
                <Button
                  size="small"
                  startIcon={<MdAdd />}
                  onClick={() => addOption(i)}
                  sx={{ ...redOutlinedButtonStyle, mb: 1 }}
                >
                  Add Option
                </Button>
                {(c.options || []).map((opt, oi) => (
                  <Box key={oi} display="flex" gap={1} mb={1}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Option label"
                      value={opt.label}
                      onChange={(e) => updateOption(i, oi, 'label', e.target.value)}
                    />
                    <TextField
                      size="small"
                      type="number"
                      placeholder="Price adj."
                      value={opt.priceAdjustment}
                      onChange={(e) =>
                        updateOption(i, oi, 'priceAdjustment', e.target.value)
                      }
                      sx={{ width: '120px' }}
                      InputProps={{ inputProps: { min: -1000 } }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeOption(i, oi)}
                    >
                      <MdRemove />
                    </IconButton>
                  </Box>
                ))}
                <Typography variant="caption" color="text.secondary">
                  💡 Price adjustment: positive = extra cost, negative = discount
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      ))}
    </Paper>
  );
}

// ─────────────────────────────────────────────────────────────────
// Offers Builder
// ─────────────────────────────────────────────────────────────────
function OffersBuilder({ offers, setFieldValue, showSnackbar }) {
  const [bulkOfferText, setBulkOfferText] = useState('');

  const add = () => setFieldValue('offers', [...offers, { ...emptyOffer }]);
  const remove = (i) =>
    setFieldValue(
      'offers',
      offers.filter((_, idx) => idx !== i)
    );
  const update = (i, key, value) => {
    const updated = offers.map((o, idx) =>
      idx === i ? { ...o, [key]: value } : o
    );
    setFieldValue('offers', updated);
  };

  const handleBulkAdd = () => {
    if (!bulkOfferText.trim()) return showSnackbar('Please enter offers', 'warning');
    const titles = bulkOfferText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const newOffers = titles.map((title) => ({
      title,
      code: title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30),
      discountPercent: 0,
      active: true,
      expiryDate: '',
      wholesaleApplicable: false,
    }));
    setFieldValue('offers', [...offers, ...newOffers]);
    setBulkOfferText('');
    showSnackbar(`Added ${newOffers.length} offers`);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" color="black">
          Offers
        </Typography>
        <Button
          startIcon={<MdAdd />}
          onClick={add}
          size="small"
          variant="outlined"
          sx={redOutlinedButtonStyle}
        >
          Add Individual Offer
        </Button>
      </Box>

      <Paper
        variant="outlined"
        sx={{ p: 2, mb: 3, bgcolor: '#fef3c7', borderColor: '#f59e0b' }}
      >
        <Typography variant="subtitle2" color="#d97706" gutterBottom>
          🎯 Quick Add: What's the Offer? (Comma Separated)
        </Typography>
        <Box display="flex" gap={2}>
          <TextField
            label="e.g., Buy 1 Get 1, 20% Off, Free Shipping"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={bulkOfferText}
            onChange={(e) => setBulkOfferText(e.target.value)}
            sx={{ bgcolor: 'white' }}
          />
          <Button
            variant="contained"
            onClick={handleBulkAdd}
            disabled={!bulkOfferText.trim()}
            sx={{ ...redButtonStyle, minWidth: '120px' }}
          >
            Add All Offers
          </Button>
        </Box>
      </Paper>

      {offers.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
          No offers added yet.
        </Typography>
      )}

      {offers.map((offer, i) => (
        <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="subtitle2" color="#dc2626">
              Offer #{i + 1}
            </Typography>
            <IconButton size="small" onClick={() => remove(i)}>
              <MdDelete />
            </IconButton>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="What's the Offer? *"
                fullWidth
                size="small"
                value={offer.title}
                onChange={(e) => update(i, 'title', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Offer Code"
                fullWidth
                size="small"
                value={offer.code}
                onChange={(e) => update(i, 'code', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Discount %"
                type="number"
                fullWidth
                size="small"
                value={offer.discountPercent}
                onChange={(e) =>
                  update(i, 'discountPercent', parseFloat(e.target.value) || 0)
                }
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl component="fieldset" sx={{ mt: 1 }}>
                <FormLabel
                  component="legend"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                  }}
                >
                  Applicable To
                </FormLabel>
                <RadioGroup
                  row
                  value={offer.wholesaleApplicable ? 'wholesale' : 'retail'}
                  onChange={(e) =>
                    update(
                      i,
                      'wholesaleApplicable',
                      e.target.value === 'wholesale'
                    )
                  }
                >
                  <FormControlLabel
                    value="retail"
                    control={
                      <Radio
                        sx={{
                          color: '#dc2626',
                          '&.Mui-checked': { color: '#dc2626' },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          🏪 Retail Only
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Offer applies only to retail/MRP price
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="wholesale"
                    control={
                      <Radio
                        sx={{
                          color: '#dc2626',
                          '&.Mui-checked': { color: '#dc2626' },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          📦 Wholesale Applicable
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Offer applies to wholesale prices too
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Expiry Date"
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={offer.expiryDate?.split('T')[0] || ''}
                onChange={(e) => update(i, 'expiryDate', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={offer.active}
                    onChange={(e) => update(i, 'active', e.target.checked)}
                    color="error"
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </Paper>
      ))}
    </Paper>
  );
}

// ─────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────
const validateForm = (values) => {
  const errors = {};
  if (!values.name?.trim()) errors.name = 'Product name is required';
  if (!values.category) errors.category = 'Category is required';
  if (!values.price || values.price <= 0) errors.price = 'Valid price is required';
  if (values.rating < 0 || values.rating > 5)
    errors.rating = 'Rating must be between 0 and 5';
  return errors;
};

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────
export default function ProductData() {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    productId: null,
    productName: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 20;

  // Media state — separated because it isn't part of Formik values
  const [existingMedia, setExistingMedia] = useState([]); // [{type, url}]
  const [newFiles, setNewFiles] = useState([]); // [File]

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ─── Fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catData, prodData] = await Promise.all([
          getCategories(),
          getProduct(),
        ]);
        setCategories(catData.categories || catData || []);
        setProducts(prodData.data || prodData || []);
      } catch (err) {
        console.error(err);
        showSnackbar('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── Populate media when editing ────────────────────────────────
  useEffect(() => {
    if (editingProduct) {
      const media = Array.isArray(editingProduct.media)
        ? editingProduct.media
        : [];
      setExistingMedia(media);
      setNewFiles([]);
    } else {
      setExistingMedia([]);
      setNewFiles([]);
    }
  }, [editingProduct]);

  // ─── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setSubmitting(true);
    setLoading(true);

    try {
      // Compute discount and saving from price vs originalPrice
      const price = parseFloat(values.price) || 0;
      const originalPrice = parseFloat(values.originalPrice) || 0;
      let discountPercent = 0;
      let amountSaving = 0;
      if (originalPrice > 0 && price > 0 && price < originalPrice) {
        discountPercent = ((originalPrice - price) / originalPrice) * 100;
        amountSaving = originalPrice - price;
      }

      // Build FormData
      const fd = new FormData();
      fd.append('name', values.name.trim());
      fd.append('productName', values.productName || '');
      fd.append('description', values.description || '');
      fd.append('category', values.category || '');
      fd.append('price', price);
      fd.append('originalPrice', originalPrice);
      fd.append('discount', discountPercent.toFixed(2));
      fd.append('amountSaving', amountSaving);
      fd.append('discountedMRP', price);
      fd.append('stock', parseInt(values.stock, 10) || 0);
      fd.append('unit', values.unit || '');
      fd.append('pack', values.pack || '');
      fd.append('rating', parseFloat(values.rating) || 0);
      fd.append('reviews', parseInt(values.reviews, 10) || 0);
      fd.append('active', values.active ? 'true' : 'false');

      // JSON arrays
      fd.append('specifications', JSON.stringify(values.specifications || []));
      fd.append('features', JSON.stringify(values.features || []));
      fd.append('tags', JSON.stringify(values.tags || []));
      fd.append('offers', JSON.stringify(values.offers || []));
      fd.append('customizations', JSON.stringify(values.customizations || []));

      // Existing media (URLs already on server)
      fd.append('media', JSON.stringify(existingMedia));

      // New files — field name must match multer config
      newFiles.forEach((file) => fd.append(FILE_FIELD, file));

      const token = localStorage.getItem('adminToken');
      const url = editingProduct
        ? `${API_BASE_URL}/${editingProduct._id}`
        : API_BASE_URL;
      const method = editingProduct ? 'put' : 'post';

      const res = await axios({
        method,
        url,
        data: fd,
        headers: {
          // Do NOT set Content-Type — axios adds multipart boundary
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const saved = res.data?.data || res.data;

      if (editingProduct) {
        setProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? saved : p))
        );
        showSnackbar('Product updated successfully');
      } else {
        setProducts((prev) => [saved, ...prev]);
        showSnackbar('Product added successfully');
      }

      resetForm();
      setEditingProduct(null);
      setExistingMedia([]);
      setNewFiles([]);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || 'Error saving product', 'error');
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  // ─── Initial values ─────────────────────────────────────────────
  const getInitialValues = () => ({
    name: editingProduct?.name || '',
    productName: editingProduct?.productName || '',
    description: editingProduct?.description || '',
    category: editingProduct?.category?._id || editingProduct?.category || '',
    unit: editingProduct?.unit || '',
    pack: editingProduct?.pack || '',
    stock: editingProduct?.stock ?? 0,
    price: editingProduct?.price ?? 0,
    originalPrice: editingProduct?.originalPrice ?? '',
    rating: editingProduct?.rating ?? 0,
    reviews: editingProduct?.reviews ?? 0,
    active: editingProduct?.active ?? true,
    tags: editingProduct?.tags || [],
    features: editingProduct?.features || [],
    specifications: editingProduct?.specifications || [],
    offers: editingProduct?.offers || [],
    customizations: editingProduct?.customizations || [],
  });

  // Computed discount preview
  const computeDiscount = (price, originalPrice) => {
    const p = parseFloat(price) || 0;
    const op = parseFloat(originalPrice) || 0;
    if (op > 0 && p > 0 && p < op) {
      return {
        percent: (((op - p) / op) * 100).toFixed(2),
        saving: op - p,
      };
    }
    return { percent: 0, saving: 0 };
  };

  if (loading && products.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Product Management
      </Typography>

      {editingProduct && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Editing: {editingProduct.productName || editingProduct.name}
          <Button
            size="small"
            onClick={() => setEditingProduct(null)}
            sx={{ ml: 2 }}
          >
            Cancel Edit
          </Button>
        </Alert>
      )}

      <Formik
        enableReinitialize
        initialValues={getInitialValues()}
        validate={validateForm}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          setFieldValue,
          handleChange,
          isSubmitting,
          resetForm,
        }) => {
          const { percent: calcDiscount, saving: calcSaving } = computeDiscount(
            values.price,
            values.originalPrice
          );

          return (
            <Form>
              <Grid container spacing={3}>
                {/* ── LEFT ── */}
                <Grid item xs={12} md={6}>
                  {/* Basic info */}
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" color="black" gutterBottom>
                      Basic Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          name="name"
                          label="Name *"
                          fullWidth
                          value={values.name}
                          onChange={handleChange}
                          error={touched.name && !!errors.name}
                          helperText={touched.name && errors.name}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="productName"
                          label="Display Product Name"
                          fullWidth
                          value={values.productName}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          select
                          name="category"
                          label="Category *"
                          fullWidth
                          value={values.category}
                          onChange={handleChange}
                          error={touched.category && !!errors.category}
                          helperText={touched.category && errors.category}
                        >
                          <MenuItem value="">
                            <em>Select Category</em>
                          </MenuItem>
                          {categories.map((c) => (
                            <MenuItem key={c._id} value={c._id}>
                              {c.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          name="unit"
                          label="Unit"
                          fullWidth
                          value={values.unit}
                          onChange={handleChange}
                          placeholder="e.g., kg, piece, box"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          name="pack"
                          label="Pack Size"
                          fullWidth
                          value={values.pack}
                          onChange={handleChange}
                          placeholder="e.g., 500g, 12 pieces"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="description"
                          label="Description"
                          fullWidth
                          multiline
                          rows={3}
                          value={values.description}
                          onChange={handleChange}
                        />
                      </Grid>

                      {/* Tags */}
                      <Grid item xs={12}>
                        <Typography
                          variant="subtitle2"
                          gutterBottom
                          sx={{ color: '#374151', fontWeight: 500 }}
                        >
                          Tags
                        </Typography>
                        <Autocomplete
                          multiple
                          freeSolo
                          options={[]}
                          value={values.tags || []}
                          onChange={(e, newValue) =>
                            setFieldValue('tags', newValue)
                          }
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                key={index}
                                label={option}
                                {...getTagProps({ index })}
                                size="small"
                                sx={{ bgcolor: '#fee2e2', color: '#dc2626' }}
                              />
                            ))
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="outlined"
                              placeholder="Type a tag and press Enter"
                              helperText="Press Enter or comma to add tags"
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ',') {
                                  event.preventDefault();
                                  const v = event.target.value;
                                  if (v && v.trim()) {
                                    const t = v.replace(/,/g, '').trim();
                                    if (t && !values.tags.includes(t)) {
                                      setFieldValue('tags', [...values.tags, t]);
                                      event.target.value = '';
                                    }
                                  }
                                }
                              }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={values.active}
                              onChange={(e) =>
                                setFieldValue('active', e.target.checked)
                              }
                              color="success"
                            />
                          }
                          label="Active"
                        />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Rating & Reviews */}
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" color="black" gutterBottom>
                      Rating &amp; Reviews
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          name="rating"
                          label="Rating (0-5)"
                          type="number"
                          fullWidth
                          inputProps={{ min: 0, max: 5, step: 0.1 }}
                          value={values.rating}
                          onChange={handleChange}
                          error={touched.rating && !!errors.rating}
                          helperText={touched.rating && errors.rating}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          name="reviews"
                          label="Review Count"
                          type="number"
                          fullWidth
                          value={values.reviews}
                          onChange={handleChange}
                        />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Features */}
                  <FeaturesBuilder
                    features={values.features}
                    setFieldValue={setFieldValue}
                  />

                  {/* Specifications */}
                  <SpecificationsBuilder
                    specifications={values.specifications}
                    setFieldValue={setFieldValue}
                  />

                  {/* Customizations */}
                  <CustomizationBuilder
                    customizations={values.customizations}
                    setFieldValue={setFieldValue}
                  />

                  {/* Offers */}
                  <OffersBuilder
                    offers={values.offers}
                    setFieldValue={setFieldValue}
                    showSnackbar={showSnackbar}
                  />
                </Grid>

                {/* ── RIGHT ── */}
                <Grid item xs={12} md={6}>
                  {/* Media */}
                  <MediaBuilder
                    existingMedia={existingMedia}
                    setExistingMedia={setExistingMedia}
                    newFiles={newFiles}
                    setNewFiles={setNewFiles}
                    uploading={uploading}
                    setUploading={setUploading}
                    showSnackbar={showSnackbar}
                  />

                  {/* Pricing & Stock */}
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" color="black" gutterBottom>
                      Pricing &amp; Stock
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          name="stock"
                          label="Stock"
                          type="number"
                          fullWidth
                          value={values.stock}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          name="originalPrice"
                          label="Original Price (MRP)"
                          type="number"
                          fullWidth
                          value={values.originalPrice}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          name="price"
                          label="Selling Price *"
                          type="number"
                          fullWidth
                          value={values.price}
                          onChange={handleChange}
                          error={touched.price && !!errors.price}
                          helperText={touched.price && errors.price}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          label="Discount %"
                          type="number"
                          fullWidth
                          value={calcDiscount}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          label="You Save (₹)"
                          type="number"
                          fullWidth
                          value={calcSaving}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Preview */}
                  {(existingMedia[0]?.url ||
                    (newFiles[0] && URL.createObjectURL(newFiles[0]))) && (
                    <Card>
                      <CardMedia
                        component="img"
                        height="200"
                        image={
                          existingMedia[0]?.url ||
                          URL.createObjectURL(newFiles[0])
                        }
                        alt={values.productName || values.name}
                      />
                      <CardContent>
                        <Typography variant="h6">
                          {values.productName || values.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {values.description?.slice(0, 100)}...
                        </Typography>
                        {values.originalPrice > values.price && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textDecoration: 'line-through' }}
                          >
                            MRP: ₹{values.originalPrice}
                          </Typography>
                        )}
                        <Typography variant="h6" color="error">
                          Price: ₹{values.price}
                        </Typography>
                        {Number(calcDiscount) > 0 && (
                          <Chip
                            label={`${calcDiscount}% OFF`}
                            size="small"
                            color="error"
                            sx={{ mt: 1, mr: 1 }}
                          />
                        )}
                        {values.active && (
                          <Chip
                            label="Active"
                            size="small"
                            color="success"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              </Grid>

              <Box
                textAlign="center"
                mt={4}
                display="flex"
                justifyContent="center"
                gap={2}
              >
                {editingProduct && (
                  <Button
                    type="button"
                    variant="outlined"
                    sx={redOutlinedButtonStyle}
                    onClick={() => {
                      resetForm();
                      setEditingProduct(null);
                      setExistingMedia([]);
                      setNewFiles([]);
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || loading}
                  size="large"
                  sx={redButtonStyle}
                >
                  {loading
                    ? 'Saving...'
                    : editingProduct
                    ? 'Update Product'
                    : 'Add Product'}
                </Button>
              </Box>
            </Form>
          );
        }}
      </Formik>

      {/* Table */}
      <Paper sx={{ mt: 6 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Media</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Price (₹)</TableCell>
                <TableCell>Discount %</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products
                .slice(
                  (currentPage - 1) * PRODUCTS_PER_PAGE,
                  currentPage * PRODUCTS_PER_PAGE
                )
                .map((p) => {
                  const firstImage = p.media?.find((m) => m.type === 'image');
                  const imageCount = (p.media || []).filter(
                    (m) => m.type === 'image'
                  ).length;
                  const videoCount = (p.media || []).filter(
                    (m) => m.type === 'video'
                  ).length;

                  return (
                    <TableRow key={p._id} hover>
                      <TableCell>
                        <img
                          src={firstImage?.url || 'https://via.placeholder.com/50'}
                          alt={p.name}
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 4,
                            objectFit: 'cover',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {p.productName || p.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.description?.slice(0, 40)}
                        </Typography>
                      </TableCell>
                      <TableCell>{p.category?.name || '-'}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {imageCount > 0 && (
                            <Chip
                              label={`${imageCount} img`}
                              size="small"
                              sx={{ bgcolor: '#fee2e2', color: '#dc2626' }}
                            />
                          )}
                          {videoCount > 0 && (
                            <Chip
                              label={`${videoCount} vid`}
                              size="small"
                              sx={{ bgcolor: '#dbeafe', color: '#2563eb' }}
                            />
                          )}
                          {imageCount === 0 && videoCount === 0 && '-'}
                        </Stack>
                      </TableCell>
                      <TableCell>{p.stock ?? '-'}</TableCell>
                      <TableCell>₹{p.price?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${p.discount || 0}%`}
                          size="small"
                          color={p.discount > 0 ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={p.active}
                          onChange={() =>
                            toggleProductStatus(p._id).then((res) =>
                              setProducts((prev) =>
                                prev.map((prod) =>
                                  prod._id === p._id
                                    ? { ...prod, active: res.active }
                                    : prod
                                )
                              )
                            )
                          }
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => setEditingProduct(p)}
                        >
                          <MdEdit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              productId: p._id,
                              productName: p.productName || p.name,
                            })
                          }
                        >
                          <MdDelete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        {products.length > PRODUCTS_PER_PAGE && (
          <Box mt={2} mb={2} display="flex" justifyContent="center" gap={2}>
            <Button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Typography>
              Page {currentPage} of{' '}
              {Math.ceil(products.length / PRODUCTS_PER_PAGE)}
            </Typography>
            <Button
              disabled={
                currentPage ===
                Math.ceil(products.length / PRODUCTS_PER_PAGE)
              }
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </Box>
        )}
      </Paper>

      {/* Delete dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() =>
          setDeleteDialog({ open: false, productId: null, productName: '' })
        }
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.productName}"? This
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteDialog({
                open: false,
                productId: null,
                productName: '',
              })
            }
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              try {
                await deleteProduct(deleteDialog.productId);
                setProducts((prev) =>
                  prev.filter((p) => p._id !== deleteDialog.productId)
                );
                setDeleteDialog({
                  open: false,
                  productId: null,
                  productName: '',
                });
                showSnackbar('Product deleted successfully');
              } catch (err) {
                showSnackbar(
                  err.response?.data?.message || 'Delete failed',
                  'error'
                );
              }
            }}
            variant="contained"
            sx={redButtonStyle}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}