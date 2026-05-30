/* eslint-disable react/prop-types */
/* eslint-disable */
import { FieldArray, Formik, Form } from 'formik';
import React, { useState, useEffect, useCallback } from 'react';
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
import { MdEdit, MdDelete, MdAdd, MdRemove, MdCloudUpload, MdInfo } from 'react-icons/md';
import { getCategories } from 'src/services/categoryService';
import { getSubCategories } from 'src/services/SubcategoryService';
import {
  createProduct,
  deleteProduct,
  getProduct,
  updateProduct,
  toggleProductStatus,
  getWholesalers,
} from 'src/services/ProductService';

const CLOUDINARY_UPLOAD_PRESET = 'market_data';
const CLOUDINARY_CLOUD_NAME = 'drq4o4qix';

const CUSTOMIZATION_TYPES = ['radio', 'checkbox', 'dropdown', 'text', 'textarea', 'file'];
const SUPER_TAGS_OPTIONS = ['design1', 'design2', 'design3', 'design4', 'design5'];

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
  showIf: { field: '', value: '' },
};

const emptyMedia = { type: 'image', url: '' };
const emptySpecification = { key: '', value: '' };
const emptyOffer = { 
  title: '', 
  code: '', 
  discountPercent: 0, 
  active: true, 
  expiryDate: '',
  wholesaleApplicable: false  // Added field
};

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

// ─── Media Builder Component ─────────────────────────────────────────────
function MediaBuilder({ media, setFieldValue, uploading, setUploading, showSnackbar }) {
  const uploadToCloudinary = async (file, resourceType = 'image') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      formData
    );
    return res.data.secure_url;
  };

  const handleFileUpload = async (e, type) => {
    const files = e.target?.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map((f) => uploadToCloudinary(f, type)));
      const newMedia = urls.map((url) => ({ type, url }));
      setFieldValue('media', [...(media || []), ...newMedia]);
      showSnackbar(`${type}(s) uploaded successfully`);
    } catch {
      showSnackbar('Upload failed', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeMedia = (i) =>
    setFieldValue('media', media.filter((_, idx) => idx !== i));

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" color="black" gutterBottom>Media (Images & Videos)</Typography>
      <Box display="flex" gap={2} mb={2}>
        <Button component="label" variant="outlined" disabled={uploading} sx={redOutlinedButtonStyle} size="small">
          + Images
          <input type="file" hidden multiple accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
        </Button>
        <Button component="label" variant="outlined" disabled={uploading} sx={redOutlinedButtonStyle} size="small">
          + Videos
          <input type="file" hidden multiple accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} />
        </Button>
      </Box>
      <Grid container spacing={1}>
        {(media || []).map((m, i) => (
          <Grid item xs={4} key={i}>
            <Box position="relative">
              {m.type === 'image' ? (
                <img src={m.url} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 6 }} />
              ) : (
                <Box sx={{ width: '100%', height: 90, bgcolor: '#1f2937', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" color="white">🎬 Video</Typography>
                </Box>
              )}
              <Chip label={m.type} size="small" sx={{ position: 'absolute', bottom: 4, left: 4, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 10 }} />
              <IconButton size="small" color="error" onClick={() => removeMedia(i)} sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'white', '&:hover': { bgcolor: '#fee2e2' } }}>✕</IconButton>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

// ─── Wholesaler Price Manager Component (No discount/savings) ─────────────────────────────
function WholesalerPriceManager({ wholesalerPrices, setFieldValue, wholesalers, mrpPrice }) {
  const [selectedWholesaler, setSelectedWholesaler] = useState('');
  const [newWholesalePrice, setNewWholesalePrice] = useState('');

  const availableWholesalers = wholesalers.filter(
    w => !wholesalerPrices.some(wp => wp.wholesalerId === w._id || wp.wholesalerId?._id === w._id)
  );

  const addWholesalerPrice = () => {
    if (!selectedWholesaler) {
      alert('Please select a wholesaler');
      return;
    }
    if (!newWholesalePrice || parseFloat(newWholesalePrice) <= 0) {
      alert('Please enter a valid wholesale price');
      return;
    }

    const newEntry = {
      wholesalerId: selectedWholesaler,
      wholesalePrice: parseFloat(newWholesalePrice),
    };

    setFieldValue('wholesalerPrices', [...wholesalerPrices, newEntry]);
    setSelectedWholesaler('');
    setNewWholesalePrice('');
  };

  const removeWholesalerPrice = (index) => {
    if (window.confirm('Remove this wholesaler pricing?')) {
      const updated = wholesalerPrices.filter((_, i) => i !== index);
      setFieldValue('wholesalerPrices', updated);
    }
  };

  const updateWholesalerPrice = (index, value) => {
    const updated = wholesalerPrices.map((wp, i) =>
      i === index ? { ...wp, wholesalePrice: parseFloat(value) || 0 } : wp
    );
    setFieldValue('wholesalerPrices', updated);
  };

  const getWholesalerInfo = (wholesalerIdData) => {
    if (wholesalerIdData && typeof wholesalerIdData === 'object' && wholesalerIdData.storeName) {
      return {
        storeName: wholesalerIdData.storeName,
        pin: wholesalerIdData.pin,
        city: wholesalerIdData.city,
        _id: wholesalerIdData._id
      };
    }
    
    if (wholesalerIdData && typeof wholesalerIdData === 'string') {
      const found = wholesalers.find(w => w._id === wholesalerIdData);
      if (found) {
        return {
          storeName: found.storeName,
          pin: found.pin,
          city: found.city,
          _id: found._id
        };
      }
    }
    
    if (wholesalerIdData && typeof wholesalerIdData === 'object') {
      return {
        storeName: wholesalerIdData.storeName || 'Unknown',
        pin: wholesalerIdData.pin || 'N/A',
        city: wholesalerIdData.city || 'Unknown',
        _id: wholesalerIdData._id
      };
    }
    
    return { storeName: 'Unknown', pin: 'N/A', city: 'Unknown', _id: null };
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" color="black">Wholesale Pricing</Typography>
        <Tooltip title="Set wholesale prices for different wholesalers">
          <IconButton size="small"><MdInfo /></IconButton>
        </Tooltip>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Configure wholesale prices for each wholesaler (based on MRP: ₹{mrpPrice || 0})
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#fef3c7', borderColor: '#f59e0b' }}>
        <Typography variant="subtitle2" color="#d97706" gutterBottom>➕ Add Wholesale Price</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField 
              select 
              label="Select Wholesaler" 
              fullWidth 
              size="small" 
              value={selectedWholesaler} 
              onChange={(e) => setSelectedWholesaler(e.target.value)}
            >
              <MenuItem value=""><em>Select Wholesaler</em></MenuItem>
              {availableWholesalers.map((w) => (
                <MenuItem key={w._id} value={w._id}>
                  {w.pin} - {w.storeName} ({w.city})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Wholesale Price (₹)"
              type="number"
              fullWidth
              size="small"
              value={newWholesalePrice}
              onChange={(e) => setNewWholesalePrice(e.target.value)}
              InputProps={{ inputProps: { min: 0, step: 1 } }}
              helperText={`MRP: ₹${mrpPrice || 0}`}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={addWholesalerPrice} 
              sx={{ ...redButtonStyle, height: '56px' }}
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {wholesalerPrices && wholesalerPrices.length > 0 ? (
        <>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            📋 Configured Wholesalers ({wholesalerPrices.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Wholesaler</strong></TableCell>
                  <TableCell><strong>PIN</strong></TableCell>
                  <TableCell><strong>City</strong></TableCell>
                  <TableCell align="right"><strong>MRP (₹)</strong></TableCell>
                  <TableCell align="right"><strong>Wholesale Price (₹)</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {wholesalerPrices.map((wp, index) => {
                  const wholesalerInfo = getWholesalerInfo(wp.wholesalerId);
                  const mrp = mrpPrice || 0;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>{wholesalerInfo.storeName}</TableCell>
                      <TableCell><Chip label={wholesalerInfo.pin} size="small" variant="outlined" /></TableCell>
                      <TableCell>{wholesalerInfo.city}</TableCell>
                      <TableCell align="right">₹{mrp.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={wp.wholesalePrice}
                          onChange={(e) => updateWholesalerPrice(index, e.target.value)}
                          size="small"
                          sx={{ width: '110px' }}
                          InputProps={{ inputProps: { min: 0, step: 1 } }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton color="error" size="small" onClick={() => removeWholesalerPrice(index)}>
                          <MdDelete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
          No wholesale prices configured. Add wholesale prices above.
        </Typography>
      )}
    </Paper>
  );
}

// ─── Customization Builder ─────────────────────────────────────────────
function CustomizationBuilder({ customizations, setFieldValue }) {
  const add = () => setFieldValue('customizations', [...customizations, { ...emptyCustomization, id: `field_${Date.now()}` }]);
  const remove = (i) => setFieldValue('customizations', customizations.filter((_, idx) => idx !== i));
  const update = (i, key, value) => {
    const updated = customizations.map((c, idx) => (idx === i ? { ...c, [key]: value } : c));
    setFieldValue('customizations', updated);
  };
  const updateShowIf = (i, key, value) => {
    const updated = customizations.map((c, idx) => idx === i ? { ...c, showIf: { ...c.showIf, [key]: value } } : c);
    setFieldValue('customizations', updated);
  };
  const addOption = (i) => {
    const updated = customizations.map((c, idx) => idx === i ? { ...c, options: [...(c.options || []), { label: '', priceAdjustment: 0 }] } : c);
    setFieldValue('customizations', updated);
  };
  const updateOption = (i, oi, field, value) => {
    const updated = customizations.map((c, idx) => idx === i ? { ...c, options: c.options.map((o, oidx) => oidx === oi ? { ...o, [field]: field === 'priceAdjustment' ? parseFloat(value) || 0 : value } : o) } : c);
    setFieldValue('customizations', updated);
  };
  const removeOption = (i, oi) => {
    const updated = customizations.map((c, idx) => idx === i ? { ...c, options: c.options.filter((_, oidx) => oidx !== oi) } : c);
    setFieldValue('customizations', updated);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" color="black">Customizations</Typography>
        <Button startIcon={<MdAdd />} onClick={add} size="small" variant="outlined" sx={redOutlinedButtonStyle}>Add Field</Button>
      </Box>
      {customizations.length === 0 && <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>No customization fields yet. Click "Add Field" to start.</Typography>}
      {customizations.map((c, i) => (
        <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" color="#dc2626">Field {i + 1}</Typography>
            <IconButton size="small" color="error" onClick={() => remove(i)}><MdDelete /></IconButton>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={4}><TextField label="Field ID" fullWidth size="small" value={c.id} onChange={(e) => update(i, 'id', e.target.value)} helperText="e.g. size, finish" /></Grid>
            <Grid item xs={4}><TextField label="Label" fullWidth size="small" value={c.label} onChange={(e) => update(i, 'label', e.target.value)} helperText="e.g. Card Size" /></Grid>
            <Grid item xs={4}><TextField select label="Type" fullWidth size="small" value={c.type} onChange={(e) => update(i, 'type', e.target.value)}>{CUSTOMIZATION_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
            <Grid item xs={6}><FormControlLabel control={<Switch checked={c.required || false} onChange={(e) => update(i, 'required', e.target.checked)} color="error" />} label="Required" /></Grid>
            <Grid item xs={6}><FormControlLabel control={<Switch checked={c.multiple || false} onChange={(e) => update(i, 'multiple', e.target.checked)} color="error" />} label="Multiple Selection" /></Grid>
            {['text', 'textarea'].includes(c.type) && <Grid item xs={12}><TextField label="Placeholder" fullWidth size="small" value={c.placeholder} onChange={(e) => update(i, 'placeholder', e.target.value)} /></Grid>}
            {['radio', 'checkbox', 'dropdown'].includes(c.type) && (
              <Grid item xs={12}>
                <Button size="small" startIcon={<MdAdd />} onClick={() => addOption(i)} sx={{ ...redOutlinedButtonStyle, mb: 1 }}>Add Option</Button>
                {(c.options || []).map((opt, oi) => (
                  <Box key={oi} display="flex" gap={1} mb={1}>
                    <TextField size="small" fullWidth placeholder="Option label" value={opt.label} onChange={(e) => updateOption(i, oi, 'label', e.target.value)} />
                    <TextField size="small" type="number" placeholder="Price adj." value={opt.priceAdjustment} onChange={(e) => updateOption(i, oi, 'priceAdjustment', e.target.value)} sx={{ width: '120px' }} InputProps={{ inputProps: { min: -1000 } }} />
                    <IconButton size="small" color="error" onClick={() => removeOption(i, oi)}><MdRemove /></IconButton>
                  </Box>
                ))}
                <Typography variant="caption" color="text.secondary">💡 Price adjustment: positive = extra cost, negative = discount</Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Show this field only if (optional):</Typography>
              <Grid container spacing={1} mt={0.5}>
                <Grid item xs={6}><TextField label="Field ID" size="small" fullWidth placeholder="e.g. printType" value={c.showIf?.field || ''} onChange={(e) => updateShowIf(i, 'field', e.target.value)} /></Grid>
                <Grid item xs={6}><TextField label="Value" size="small" fullWidth placeholder="e.g. Double Side" value={c.showIf?.value || ''} onChange={(e) => updateShowIf(i, 'value', e.target.value)} /></Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      ))}
    </Paper>
  );
}

// ─── Specifications Builder ─────────────────────────────────────────────────
function SpecificationsBuilder({ specifications, setFieldValue }) {
  const add = () => setFieldValue('specifications', [...specifications, { key: '', value: '' }]);
  const remove = (i) => setFieldValue('specifications', specifications.filter((_, idx) => idx !== i));
  const update = (i, key, value) => {
    const updated = specifications.map((spec, idx) => idx === i ? { ...spec, [key]: value } : spec);
    setFieldValue('specifications', updated);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" color="black">Specifications</Typography>
        <Button startIcon={<MdAdd />} onClick={add} size="small" variant="outlined" sx={redOutlinedButtonStyle}>Add Specification</Button>
      </Box>
      {specifications.map((spec, i) => (
        <Box key={i} display="flex" gap={2} mb={2}>
          <TextField label="Key" size="small" fullWidth value={spec.key} onChange={(e) => update(i, 'key', e.target.value)} placeholder="e.g., Material" />
          <TextField label="Value" size="small" fullWidth value={spec.value} onChange={(e) => update(i, 'value', e.target.value)} placeholder="e.g., Premium Paper" />
          <IconButton color="error" onClick={() => remove(i)}><MdDelete /></IconButton>
        </Box>
      ))}
    </Paper>
  );
}

// ─── Offers Builder with Wholesale Applicability Radio Buttons ─────────────────────────────
function OffersBuilder({ offers, setFieldValue, showSnackbar }) {
  const [bulkOfferText, setBulkOfferText] = useState('');
  
  const add = () => setFieldValue('offers', [...offers, { ...emptyOffer }]);
  const remove = (i) => setFieldValue('offers', offers.filter((_, idx) => idx !== i));
  const update = (i, key, value) => {
    const updated = offers.map((offer, idx) => idx === i ? { ...offer, [key]: value } : offer);
    setFieldValue('offers', updated);
  };

  const handleBulkAdd = () => {
    if (!bulkOfferText.trim()) return showSnackbar('Please enter offers', 'warning');
    const offerTitles = bulkOfferText.split(',').map(item => item.trim()).filter(item => item);
    const newOffers = offerTitles.map(title => ({ 
      title, 
      code: title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30), 
      discountPercent: 0, 
      active: true, 
      expiryDate: '',
      wholesaleApplicable: false 
    }));
    setFieldValue('offers', [...offers, ...newOffers]);
    setBulkOfferText('');
    showSnackbar(`Added ${newOffers.length} offers`);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" color="black">Offers</Typography>
        <Button startIcon={<MdAdd />} onClick={add} size="small" variant="outlined" sx={redOutlinedButtonStyle}>Add Individual Offer</Button>
      </Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#fef3c7', borderColor: '#f59e0b' }}>
        <Typography variant="subtitle2" color="#d97706" gutterBottom>🎯 Quick Add: What's the Offer? (Comma Separated)</Typography>
        <Box display="flex" gap={2}>
          <TextField label="e.g., Buy 1 Get 1, 20% Off, Free Shipping" fullWidth size="small" multiline rows={2} value={bulkOfferText} onChange={(e) => setBulkOfferText(e.target.value)} sx={{ bgcolor: 'white' }} />
          <Button variant="contained" onClick={handleBulkAdd} disabled={!bulkOfferText.trim()} sx={{ ...redButtonStyle, minWidth: '120px' }}>Add All Offers</Button>
        </Box>
      </Paper>
      {offers.length === 0 && <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>No offers added yet.</Typography>}
      {offers.map((offer, i) => (
        <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="subtitle2" color="#dc2626">Offer #{i + 1}</Typography>
            <IconButton size="small" onClick={() => remove(i)}><MdDelete /></IconButton>
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
                onChange={(e) => update(i, 'discountPercent', parseFloat(e.target.value) || 0)} 
                inputProps={{ min: 0, max: 100 }} 
              />
            </Grid>
            
            {/* ✅ Wholesale Applicability Radio Buttons */}
            <Grid item xs={12}>
              <FormControl component="fieldset" sx={{ mt: 1 }}>
                <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                  Applicable To
                </FormLabel>
                <RadioGroup
                  row
                  value={offer.wholesaleApplicable ? 'wholesale' : 'retail'}
                  onChange={(e) => update(i, 'wholesaleApplicable', e.target.value === 'wholesale')}
                >
                  <FormControlLabel 
                    value="retail" 
                    control={<Radio sx={{ color: '#dc2626', '&.Mui-checked': { color: '#dc2626' } }} />} 
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={500}>🏪 Retail Only</Typography>
                        <Typography variant="caption" color="text.secondary">Offer applies only to retail/MRP price</Typography>
                      </Box>
                    } 
                  />
                  <FormControlLabel 
                    value="wholesale" 
                    control={<Radio sx={{ color: '#dc2626', '&.Mui-checked': { color: '#dc2626' } }} />} 
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={500}>📦 Wholesale Applicable</Typography>
                        <Typography variant="caption" color="text.secondary">Offer applies to wholesale prices too</Typography>
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

// ─── Validation Function ─────────────────────────────────────────────────────
const validateForm = (values) => {
  const errors = {};
  
  if (!values.name || values.name.trim() === '') {
    errors.name = 'Product name is required';
  }
  if (!values.category) {
    errors.category = 'Category is required';
  }
  if (!values.subCategory) {
    errors.subCategory = 'Sub category is required';
  }
  if (!values.price || values.price <= 0) {
    errors.price = 'Valid price is required';
  }
  if (values.rating < 0 || values.rating > 5) {
    errors.rating = 'Rating must be between 0 and 5';
  }
  if (values.superTags?.length > 5) {
    errors.superTags = 'Maximum 5 super tags allowed';
  }
  if (values.wholeSalerDefault < 0) {
    errors.wholeSalerDefault = 'Price cannot be negative';
  }
  
  return errors;
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ProductData() {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  const [wholesalers, setWholesalers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, productId: null, productName: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 20;

  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  // ✅ DISCOUNT CALCULATION FOR MAIN PRODUCT
  const calculateDiscount = useCallback((originalPrice, sellingPrice, setFieldValue) => {
    const origPrice = parseFloat(originalPrice) || 0;
    const sellPrice = parseFloat(sellingPrice) || 0;
    
    if (origPrice > 0 && sellPrice > 0 && sellPrice < origPrice) {
      const discountPercent = ((origPrice - sellPrice) / origPrice * 100).toFixed(2);
      const youSave = origPrice - sellPrice;
      setFieldValue('discountPercent', parseFloat(discountPercent));
      setFieldValue('youSave', youSave);
    } else {
      setFieldValue('discountPercent', 0);
      setFieldValue('youSave', 0);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catData, subData, prodData, wholeData] = await Promise.all([
          getCategories(), 
          getSubCategories(), 
          getProduct(), 
          getWholesalers()
        ]);
        setCategories(catData.categories || catData || []);
        setSubCategories(subData.subcategories || subData || []);
        setProducts(prodData.data || prodData || []);
        setWholesalers(wholeData.wholesalers || wholeData.data || wholeData || []);
      } catch (err) {
        console.error(err);
        showSnackbar('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filterSubCategories = useCallback((categoryId) => {
    if (!categoryId) return setFilteredSubCategories([]);
    setFilteredSubCategories(subCategories.filter(s => s.category?._id === categoryId || s.category === categoryId));
  }, [subCategories]);

  useEffect(() => {
    if (editingProduct) {
      const categoryId = editingProduct.category?._id || editingProduct.category;
      if (categoryId) filterSubCategories(categoryId);
    }
  }, [editingProduct, filterSubCategories]);

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setSubmitting(true);
    setLoading(true);
    try {
      const formattedWholesalerPrices = (values.wholesalerPrices || []).map(wp => ({
        wholesalerId: wp.wholesalerId?._id || wp.wholesalerId,
        wholesalePrice: wp.wholesalePrice
      }));

      // Calculate final values
      const finalPrice = parseFloat(values.price);
      const finalOriginalPrice = values.originalPrice ? parseFloat(values.originalPrice) : null;
      let discountPercent = 0;
      let youSave = 0;
      
      if (finalOriginalPrice && finalPrice && finalPrice < finalOriginalPrice) {
        discountPercent = ((finalOriginalPrice - finalPrice) / finalOriginalPrice * 100).toFixed(2);
        youSave = finalOriginalPrice - finalPrice;
      }

      const submitData = {
        name: values.name,
        productName: values.productName,
        category: values.category,
        subCategory: values.subCategory,
        unit: values.unit,
        pack: values.pack,
        description: values.description,
        stock: parseInt(values.stock) || 0,
        price: finalPrice,
        originalPrice: finalOriginalPrice,
        discount: parseFloat(discountPercent),
        amountSaving: youSave,
        discountedMRP: finalPrice,
        rating: parseFloat(values.rating) || 0,
        reviews: parseInt(values.reviews) || 0,
        popular: values.popular,
        active: values.active,
        image: values.image,
        images: values.images,
        canvasimages: values.canvasimages,
        media: values.media,
        customizations: values.customizations,
        specifications: values.specifications,
        tags: values.tags,
        superTags: values.superTags,
        offers: values.offers, // Now includes wholesaleApplicable field
        more_details: values.more_details,
        wholesalerPrices: formattedWholesalerPrices,
        wholeSalerDefault: parseFloat(values.wholeSalerDefault) || 0,
      };

      if (editingProduct) {
        const res = await updateProduct(editingProduct._id, submitData);
        setProducts(prev => prev.map(p => p._id === editingProduct._id ? res.product : p));
        showSnackbar('Product updated successfully');
      } else {
        const res = await createProduct(submitData);
        setProducts(prev => [res.product, ...prev]);
        showSnackbar('Product added successfully');
      }
      resetForm();
      setEditingProduct(null);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || 'Error saving product', 'error');
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const getInitialValues = () => ({
    name: editingProduct?.name || '',
    productName: editingProduct?.productName || '',
    category: editingProduct?.category?._id || editingProduct?.category || '',
    subCategory: editingProduct?.subCategory?._id || editingProduct?.subCategory || '',
    unit: editingProduct?.unit || '',
    pack: editingProduct?.pack || '',
    description: editingProduct?.description || '',
    stock: editingProduct?.stock || 0,
    price: editingProduct?.price || 0,
    originalPrice: editingProduct?.originalPrice || '',
    discountPercent: editingProduct?.discount || 0,
    youSave: editingProduct?.amountSaving || 0,
    rating: editingProduct?.rating || 0,
    reviews: editingProduct?.reviews || 0,
    popular: editingProduct?.popular || false,
    active: editingProduct?.active ?? true,
    image: editingProduct?.image || '',
    images: editingProduct?.images || [],
    canvasimages: editingProduct?.canvasimages || [],
    media: editingProduct?.media || [],
    customizations: editingProduct?.customizations || [],
    specifications: editingProduct?.specifications || [],
    tags: editingProduct?.tags || [],
    superTags: editingProduct?.superTags || [],
    offers: (editingProduct?.offers || []).map(offer => ({
      ...offer,
      wholesaleApplicable: offer.wholesaleApplicable ?? false
    })),
    wholesalerPrices: (editingProduct?.wholesalerPrices || []).map(wp => ({
      wholesalerId: wp.wholesalerId?._id || wp.wholesalerId,
      wholesalePrice: wp.wholesalePrice
    })),
    wholeSalerDefault: editingProduct?.wholeSalerDefault || 0,
    more_details: editingProduct?.more_details || { brand: '', expiry: '' },
  });

  if (loading && products.length === 0) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>Product Management</Typography>

      {editingProduct && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Editing: {editingProduct.productName || editingProduct.name}
          <Button size="small" onClick={() => setEditingProduct(null)} sx={{ ml: 2 }}>Cancel Edit</Button>
        </Alert>
      )}

      <Formik 
        enableReinitialize 
        initialValues={getInitialValues()} 
        validate={validateForm}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, setFieldValue, handleChange, isSubmitting, resetForm }) => (
          <Form>
            <Grid container spacing={3}>
              {/* ── LEFT COLUMN ── */}
              <Grid item xs={12} md={6}>
                {/* Basic Information */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" color="black" gutterBottom>Basic Information</Typography>
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
                    <Grid item xs={6}>
                      <TextField 
                        select 
                        name="category" 
                        label="Category *" 
                        fullWidth 
                        value={values.category} 
                        onChange={(e) => { 
                          handleChange(e); 
                          filterSubCategories(e.target.value); 
                          setFieldValue('subCategory', ''); 
                        }} 
                        error={touched.category && !!errors.category}
                        helperText={touched.category && errors.category}
                      >
                        <MenuItem value=""><em>Select Category</em></MenuItem>
                        {categories.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField 
                        select 
                        name="subCategory" 
                        label="Sub Category *" 
                        fullWidth 
                        value={values.subCategory} 
                        disabled={!values.category} 
                        onChange={handleChange}
                        error={touched.subCategory && !!errors.subCategory}
                        helperText={touched.subCategory && errors.subCategory}
                      >
                        <MenuItem value=""><em>Select Sub Category</em></MenuItem>
                        {filteredSubCategories.map(s => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField name="unit" label="Unit" fullWidth value={values.unit} onChange={handleChange} placeholder="e.g., kg, piece, box" />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField name="pack" label="Pack Size" fullWidth value={values.pack} onChange={handleChange} placeholder="e.g., 500g, 12 pieces" />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField name="description" label="Description" fullWidth multiline rows={3} value={values.description} onChange={handleChange} />
                    </Grid>

                    {/* Tags */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom sx={{ color: '#374151', fontWeight: 500 }}>Tags</Typography>
                      <Autocomplete 
                        multiple 
                        freeSolo 
                        options={[]} 
                        value={values.tags || []} 
                        onChange={(event, newValue) => setFieldValue('tags', newValue)} 
                        renderTags={(value, getTagProps) => value.map((option, index) => (
                          <Chip key={index} label={option} {...getTagProps({ index })} size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626' }} />
                        ))} 
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            variant="outlined" 
                            placeholder="Type a tag and press Enter" 
                            helperText="Press Enter or comma to add tags" 
                            onKeyDown={(event) => { 
                              if (event.key === 'Enter' || event.key === ',') { 
                                event.preventDefault(); 
                                const inputValue = event.target.value; 
                                if (inputValue && inputValue.trim()) { 
                                  const newTag = inputValue.replace(/,/g, '').trim(); 
                                  if (newTag && !values.tags.includes(newTag)) { 
                                    setFieldValue('tags', [...values.tags, newTag]); 
                                    event.target.value = ''; 
                                  } 
                                } 
                              } 
                            }} 
                          />
                        )} 
                      />
                    </Grid>

                    {/* Super Tags */}
                    <Grid item xs={12}>
                      <Autocomplete 
                        multiple 
                        options={SUPER_TAGS_OPTIONS} 
                        value={values.superTags} 
                        onChange={(e, newValue) => setFieldValue('superTags', newValue.slice(0, 5))} 
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            label="Super Tags (max 5)" 
                            error={touched.superTags && !!errors.superTags} 
                            helperText={touched.superTags && errors.superTags} 
                          />
                        )} 
                      />
                    </Grid>

                    {/* Flags */}
                    <Grid item xs={6}>
                      <FormControlLabel 
                        control={<Switch checked={values.popular} onChange={(e) => setFieldValue('popular', e.target.checked)} color="error" />} 
                        label="Popular" 
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel 
                        control={<Switch checked={values.active} onChange={(e) => setFieldValue('active', e.target.checked)} color="success" />} 
                        label="Active" 
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Extra Details */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" color="black" gutterBottom>Extra Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField name="more_details.brand" label="Brand" fullWidth value={values.more_details.brand} onChange={handleChange} />
                    </Grid>
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
                      <TextField name="reviews" label="Review Count" type="number" fullWidth value={values.reviews} onChange={handleChange} />
                    </Grid>
                  </Grid>
                </Paper>

                {/* WholeSaler Default Price - Independent Field */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" color="black" gutterBottom>Wholesaler Default Settings</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        name="wholeSalerDefault"
                        label="WholeSaler Default Price"
                        type="number"
                        fullWidth
                        value={values.wholeSalerDefault}
                        onChange={handleChange}
                        InputProps={{ inputProps: { min: 0, step: 1 } }}
                        helperText="This is an independent field with no relation to MRP or wholesale prices"
                        error={touched.wholeSalerDefault && !!errors.wholeSalerDefault}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Multiple Wholesale Pricing */}
                <WholesalerPriceManager 
                  wholesalerPrices={values.wholesalerPrices} 
                  setFieldValue={setFieldValue} 
                  wholesalers={wholesalers}
                  mrpPrice={values.price}
                />

                {/* Specifications */}
                <SpecificationsBuilder specifications={values.specifications} setFieldValue={setFieldValue} />

                {/* Customizations */}
                <CustomizationBuilder customizations={values.customizations} setFieldValue={setFieldValue} />

                {/* Offers - Updated with wholesaleApplicable */}
                <OffersBuilder offers={values.offers} setFieldValue={setFieldValue} showSnackbar={showSnackbar} />
              </Grid>

              {/* ── RIGHT COLUMN ── */}
              <Grid item xs={12} md={6}>
                {/* Main Image */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" color="black" gutterBottom>Main Image</Typography>
                  <Button component="label" variant="outlined" fullWidth sx={redOutlinedButtonStyle} disabled={uploading}>
                    {uploading ? <CircularProgress size={24} /> : 'Upload Main Image'}
                    <input type="file" hidden accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                        const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, formData);
                        setFieldValue('image', res.data.secure_url);
                        showSnackbar('Main image uploaded');
                      } catch { showSnackbar('Upload failed', 'error'); } finally { setUploading(false); }
                    }} />
                  </Button>
                  {values.image && <Box mt={2}><img src={values.image} alt="Main" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} /></Box>}
                </Paper>

                {/* Canvas Images */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" color="black" gutterBottom>Canvas Images</Typography>
                  <FieldArray name="canvasimages">
                    {({ push, remove }) => (
                      <>
                        <Button component="label" variant="outlined" fullWidth sx={redOutlinedButtonStyle} disabled={uploading}>
                          {uploading ? <CircularProgress size={24} /> : 'Upload Canvas Images'}
                          <input type="file" hidden multiple accept="image/*" onChange={async (e) => {
                            const files = e.target.files;
                            if (!files?.length) return;
                            setUploading(true);
                            try {
                              const urls = await Promise.all(Array.from(files).map(async (f) => {
                                const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                                const r = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, fd);
                                return r.data.secure_url;
                              }));
                              urls.forEach(u => push(u));
                              showSnackbar('Canvas images uploaded');
                            } catch { showSnackbar('Upload failed', 'error'); } finally { setUploading(false); }
                          }} />
                        </Button>
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          {values.canvasimages?.map((img, i) => (
                            <Grid item xs={4} key={i}>
                              <Box position="relative">
                                <img src={img} alt={`Canvas ${i + 1}`} style={{ width: '100%', height: 100, borderRadius: 8, objectFit: 'cover' }} />
                                <IconButton size="small" color="error" onClick={() => remove(i)} sx={{ position: 'absolute', top: -5, right: -5, bgcolor: 'white' }}>✕</IconButton>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </>
                    )}
                  </FieldArray>
                </Paper>

                {/* Media */}
                <MediaBuilder media={values.media} setFieldValue={setFieldValue} uploading={uploading} setUploading={setUploading} showSnackbar={showSnackbar} />

                {/* Gallery Images */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" color="black" gutterBottom>Gallery Images</Typography>
                  <FieldArray name="images">
                    {({ push, remove }) => (
                      <>
                        <Button component="label" variant="outlined" fullWidth sx={redOutlinedButtonStyle} disabled={uploading}>
                          {uploading ? <CircularProgress size={24} /> : 'Upload Gallery Images'}
                          <input type="file" hidden multiple accept="image/*" onChange={async (e) => {
                            const files = e.target.files;
                            if (!files?.length) return;
                            setUploading(true);
                            try {
                              const urls = await Promise.all(Array.from(files).map(async (f) => {
                                const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                                const r = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, fd);
                                return r.data.secure_url;
                              }));
                              urls.forEach(u => push(u));
                              showSnackbar('Gallery images uploaded');
                            } catch { showSnackbar('Upload failed', 'error'); } finally { setUploading(false); }
                          }} />
                        </Button>
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          {values.images.map((img, i) => (
                            <Grid item xs={4} key={i}>
                              <Box position="relative">
                                <img src={img} alt="" style={{ width: '100%', height: 100, borderRadius: 8, objectFit: 'cover' }} />
                                <IconButton size="small" color="error" onClick={() => remove(i)} sx={{ position: 'absolute', top: -5, right: -5, bgcolor: 'white' }}>✕</IconButton>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </>
                    )}
                  </FieldArray>
                </Paper>

                {/* Pricing & Stock WITH DISPLAY CALCULATION */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" color="black" gutterBottom>Pricing & Stock</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField name="stock" label="Stock" type="number" fullWidth value={values.stock} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField 
                        name="originalPrice" 
                        label="Original Price" 
                        type="number" 
                        fullWidth 
                        value={values.originalPrice} 
                        onChange={(e) => { 
                          handleChange(e); 
                          calculateDiscount(e.target.value, values.price, setFieldValue);
                        }} 
                        placeholder="Original price (MRP)"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField 
                        name="price" 
                        label="Selling Price" 
                        type="number" 
                        fullWidth 
                        value={values.price} 
                        onChange={(e) => { 
                          handleChange(e); 
                          calculateDiscount(values.originalPrice, e.target.value, setFieldValue);
                        }} 
                        error={touched.price && !!errors.price} 
                        helperText={touched.price && errors.price} 
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField 
                        name="discountPercent" 
                        label="Discount %" 
                        type="number" 
                        fullWidth 
                        value={values.discountPercent} 
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField 
                        name="youSave" 
                        label="You Save (₹)" 
                        type="number" 
                        fullWidth 
                        value={values.youSave} 
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Preview */}
                {(values.image || values.images?.[0]) && (
                  <Card>
                    <CardMedia component="img" height="200" image={values.image || values.images[0]} alt={values.productName || values.name} />
                    <CardContent>
                      <Typography variant="h6">{values.productName || values.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{values.description?.slice(0, 100)}...</Typography>
                      {values.originalPrice && values.originalPrice > values.price && (
                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                          MRP: ₹{values.originalPrice}
                        </Typography>
                      )}
                      <Typography variant="h6" color="error">Price: ₹{values.price}</Typography>
                      {values.discountPercent > 0 && (
                        <Chip label={`${values.discountPercent}% OFF`} size="small" color="error" sx={{ mt: 1, mr: 1 }} />
                      )}
                      {values.popular && <Chip label="Popular" size="small" color="warning" sx={{ mt: 1, mr: 1 }} />}
                      {values.active && <Chip label="Active" size="small" color="success" sx={{ mt: 1 }} />}
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>

            <Box textAlign="center" mt={4} display="flex" justifyContent="center" gap={2}>
              {editingProduct && (
                <Button 
                  type="button" 
                  variant="outlined" 
                  sx={redOutlinedButtonStyle} 
                  onClick={() => { 
                    resetForm(); 
                    setEditingProduct(null); 
                    setFilteredSubCategories([]); 
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
                {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </Box>
          </Form>
        )}
      </Formik>

      {/* Product Table */}
      <Paper sx={{ mt: 6 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Sub Category</TableCell>
                <TableCell>Wholesalers</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Price (₹)</TableCell>
                <TableCell>Discount %</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE).map(p => {
                let wholesalerDisplay = '-';
                if (p.wholesalerPrices && p.wholesalerPrices.length > 0) {
                  const counts = p.wholesalerPrices.length;
                  wholesalerDisplay = `${counts} wholesaler${counts > 1 ? 's' : ''}`;
                } else if (p.WholeSaler && p.WholeSaler.storeName) {
                  wholesalerDisplay = p.WholeSaler.storeName;
                }
                
                return (
                  <TableRow key={p._id} hover>
                    <TableCell>
                      <img 
                        src={p.image || p.images?.[0] || 'https://via.placeholder.com/50'} 
                        alt={p.name} 
                        style={{ width: 50, height: 50, borderRadius: 4, objectFit: 'cover' }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{p.productName || p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.description?.slice(0, 40)}</Typography>
                    </TableCell>
                    <TableCell>{p.category?.name || '-'}</TableCell>
                    <TableCell>{p.subCategory?.name || '-'}</TableCell>
                    <TableCell>
                      <Tooltip title={p.wholesalerPrices?.map(wp => `${wp.wholesalerId?.storeName || wp.wholesalerId}: ₹${wp.wholesalePrice}`).join('\n') || 'No wholesalers'}>
                        <Chip label={wholesalerDisplay} size="small" color={p.wholesalerPrices?.length > 0 ? "primary" : "default"} />
                      </Tooltip>
                    </TableCell>
                    <TableCell>{p.stock ?? '-'}</TableCell>
                    <TableCell>₹{p.price?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={`${p.discount || 0}%`} size="small" color={p.discount > 0 ? "error" : "default"} />
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={p.active} 
                        onChange={() => toggleProductStatus(p._id).then(res => setProducts(prev => prev.map(prod => prod._id === p._id ? { ...prod, active: res.active } : prod)))} 
                        color="success" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => setEditingProduct(p)}><MdEdit /></IconButton>
                      <IconButton color="error" onClick={() => setDeleteDialog({ open: true, productId: p._id, productName: p.productName || p.name })}><MdDelete /></IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {products.length > PRODUCTS_PER_PAGE && (
          <Box mt={2} mb={2} display="flex" justifyContent="center" gap={2}>
            <Button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
            <Typography>Page {currentPage} of {Math.ceil(products.length / PRODUCTS_PER_PAGE)}</Typography>
            <Button disabled={currentPage === Math.ceil(products.length / PRODUCTS_PER_PAGE)} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
          </Box>
        )}
      </Paper>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, productId: null, productName: '' })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete "{deleteDialog.productName}"? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, productId: null, productName: '' })}>Cancel</Button>
          <Button 
            onClick={async () => { 
              await deleteProduct(deleteDialog.productId); 
              setProducts(prev => prev.filter(p => p._id !== deleteDialog.productId)); 
              setDeleteDialog({ open: false, productId: null, productName: '' }); 
              showSnackbar('Product deleted successfully'); 
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
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}