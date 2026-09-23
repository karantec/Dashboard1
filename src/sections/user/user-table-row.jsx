/* eslint-disable react/prop-types */
import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
// eslint-disable-next-line perfectionist/sort-imports
import Chip from '@mui/material/Chip';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function UserTableRow({
  selected,
  name,
  email,
  phone,
  avatar,
  role,
  createdAt,
  updatedAt,
  handleClick,
}) {
  const [open, setOpen] = useState(null);

  const handleOpenMenu = (event) => setOpen(event.currentTarget);
  const handleCloseMenu = () => setOpen(null);

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—';

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        {/* 1. Checkbox */}
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={handleClick} />
        </TableCell>

        {/* 2. Name + Avatar */}
        <TableCell component="th" scope="row" padding="none">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar alt={name} src={avatar || undefined}>
              {name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Typography variant="subtitle2" noWrap>
              {name || '—'}
            </Typography>
          </Stack>
        </TableCell>

        {/* 3. Email */}
        <TableCell>{email || '—'}</TableCell>

        {/* 4. Phone */}
        <TableCell>{phone || '—'}</TableCell>

        {/* 5. Role */}
        <TableCell align="center">
          <Chip
            label={role}
            size="small"
            color={role === 'admin' ? 'error' : 'default'}
          />
        </TableCell>

        {/* 6. Created At */}
        <TableCell>{formatDate(createdAt)}</TableCell>

        {/* 7. Updated At */}
        <TableCell>{formatDate(updatedAt)}</TableCell>

        {/* 8. Actions */}
        <TableCell align="center">
          <IconButton onClick={handleOpenMenu}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Row Actions Menu */}
      <Popover
        open={!!open}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleCloseMenu}>
          <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />
          Edit
        </MenuItem>

        <MenuItem onClick={handleCloseMenu} sx={{ color: 'error.main' }}>
          <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Popover>
    </>
  );
}