import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(MuiButton)(({ theme, variant, size }) => ({
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  fontWeight: 500,
  boxShadow: 'none',
  '&:hover': {
    boxShadow: variant === 'contained' ? theme.shadows[2] : 'none',
  },
  '&:focus': {
    boxShadow: `0 0 0 2px ${theme.palette.primary.main}25`,
  },
  ...(size === 'small' && {
    padding: theme.spacing(0.5, 1.5),
    fontSize: '0.875rem',
  }),
  ...(size === 'medium' && {
    padding: theme.spacing(1, 2),
    fontSize: '0.875rem',
  }),
  ...(size === 'large' && {
    padding: theme.spacing(1.5, 3),
    fontSize: '1rem',
  }),
}));

function Button({
  children,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  startIcon,
  endIcon,
  fullWidth = false,
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <StyledButton
      variant={variant}
      color={color}
      size={size}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      endIcon={!loading ? endIcon : null}
      fullWidth={fullWidth}
      onClick={onClick}
      type={type}
      {...props}
    >
      {children}
    </StyledButton>
  );
}

export default Button;