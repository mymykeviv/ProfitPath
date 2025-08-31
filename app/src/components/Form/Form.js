import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Button from '../Button/Button';

const StyledForm = styled('form')(({ theme }) => ({
  width: '100%',
  '& .MuiGrid-item': {
    display: 'flex',
    flexDirection: 'column',
  },
}));

const FormSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '&:last-child': {
    marginBottom: 0,
  },
}));

const FormHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

function Form({
  children,
  onSubmit,
  title,
  subtitle,
  loading = false,
  error,
  success,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onCancel,
  showActions = true,
  submitDisabled = false,
  spacing = 2,
  maxWidth = 'md',
  ...props
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSubmit && !loading) {
      onSubmit(event);
    }
  };

  return (
    <Box sx={{ maxWidth: maxWidth === 'md' ? 800 : maxWidth, mx: 'auto' }}>
      {(title || subtitle) && (
        <FormHeader>
          {title && (
            <Typography variant="h5" component="h2" gutterBottom>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body1" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </FormHeader>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <StyledForm onSubmit={handleSubmit} {...props}>
        <Grid container spacing={spacing}>
          {children}
        </Grid>
        
        {showActions && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              mt: 3,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelText}
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              loading={loading}
              disabled={submitDisabled || loading}
            >
              {submitText}
            </Button>
          </Box>
        )}
      </StyledForm>
      
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}

// Form field wrapper component
export function FormField({ children, xs = 12, sm, md, lg, xl, ...gridProps }) {
  return (
    <Grid item xs={xs} sm={sm} md={md} lg={lg} xl={xl} {...gridProps}>
      {children}
    </Grid>
  );
}

// Form section component for grouping related fields
export function FormSectionComponent({ title, subtitle, children, ...props }) {
  return (
    <FormSection {...props}>
      {(title || subtitle) && (
        <Box sx={{ mb: 2 }}>
          {title && (
            <Typography variant="h6" component="h3" gutterBottom>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
      <Grid container spacing={2}>
        {children}
      </Grid>
    </FormSection>
  );
}

// Hook for form validation
export function useFormValidation(initialValues, validationRules) {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const validateField = React.useCallback((name, value) => {
    const rule = validationRules[name];
    if (!rule) return '';

    if (rule.required && (!value || value.toString().trim() === '')) {
      return rule.requiredMessage || `${name} is required`;
    }

    if (rule.minLength && value.toString().length < rule.minLength) {
      return rule.minLengthMessage || `${name} must be at least ${rule.minLength} characters`;
    }

    if (rule.maxLength && value.toString().length > rule.maxLength) {
      return rule.maxLengthMessage || `${name} must be no more than ${rule.maxLength} characters`;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.patternMessage || `${name} format is invalid`;
    }

    if (rule.custom && typeof rule.custom === 'function') {
      return rule.custom(value, values) || '';
    }

    return '';
  }, [validationRules, values]);

  const validateForm = React.useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField]);

  const handleChange = React.useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  const handleBlur = React.useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField, values]);

  const reset = React.useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}

export default Form;