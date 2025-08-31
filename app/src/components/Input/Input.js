import React from 'react';
import {
  TextField,
  FormControl,
  FormLabel,
  FormHelperText,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1),
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderWidth: 2,
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  },
  '& .MuiFormHelperText-root': {
    marginLeft: 0,
    marginTop: theme.spacing(0.5),
  },
}));

function Input({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  type = 'text',
  error = false,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  multiline = false,
  rows = 4,
  startAdornment,
  endAdornment,
  showPasswordToggle = false,
  size = 'medium',
  variant = 'outlined',
  name,
  id,
  autoComplete,
  autoFocus = false,
  ...props
}) {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const endAdornmentContent = React.useMemo(() => {
    if (type === 'password' && showPasswordToggle) {
      return (
        <InputAdornment position="end">
          <IconButton
            onClick={handleTogglePassword}
            edge="end"
            size="small"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
          {endAdornment}
        </InputAdornment>
      );
    }
    return endAdornment;
  }, [type, showPasswordToggle, showPassword, endAdornment]);

  return (
    <FormControl fullWidth={fullWidth} error={error}>
      {label && (
        <FormLabel
          component="label"
          htmlFor={id || name}
          sx={{
            mb: 1,
            fontWeight: 500,
            color: 'text.primary',
            '&.Mui-error': {
              color: 'error.main',
            },
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'red', marginLeft: 4 }}>*</span>
          )}
        </FormLabel>
      )}
      <StyledTextField
        id={id || name}
        name={name}
        type={inputType}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        error={error}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        multiline={multiline}
        rows={multiline ? rows : undefined}
        size={size}
        variant={variant}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        InputProps={{
          startAdornment,
          endAdornment: endAdornmentContent,
        }}
        {...props}
      />
      {helperText && (
        <FormHelperText error={error}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}

export default Input;