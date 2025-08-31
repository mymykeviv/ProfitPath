import React from 'react';
import {
  Card as MuiCard,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(MuiCard)(({ theme, elevation = 1 }) => ({
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: elevation === 0 ? 'none' : theme.shadows[elevation],
  transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[Math.min(elevation + 2, 24)],
  },
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  paddingBottom: theme.spacing(1),
  '& .MuiCardHeader-title': {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  '& .MuiCardHeader-subheader': {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
}));

const StyledCardContent = styled(CardContent)(({ theme, noPadding }) => ({
  ...(noPadding && {
    padding: 0,
    '&:last-child': {
      paddingBottom: 0,
    },
  }),
}));

const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(1, 2, 2),
  justifyContent: 'flex-end',
  '&.MuiCardActions-spacing > :not(:first-of-type)': {
    marginLeft: theme.spacing(1),
  },
}));

function Card({
  children,
  title,
  subtitle,
  headerAction,
  actions,
  elevation = 1,
  noPadding = false,
  showDivider = false,
  className,
  sx,
  ...props
}) {
  const hasHeader = title || subtitle || headerAction;
  const hasActions = actions && actions.length > 0;

  return (
    <StyledCard
      elevation={elevation}
      className={className}
      sx={sx}
      {...props}
    >
      {hasHeader && (
        <>
          <StyledCardHeader
            title={title}
            subheader={subtitle}
            action={headerAction}
          />
          {showDivider && <Divider />}
        </>
      )}
      
      <StyledCardContent noPadding={noPadding}>
        {children}
      </StyledCardContent>
      
      {hasActions && (
        <>
          {showDivider && <Divider />}
          <StyledCardActions>
            {actions.map((action, index) => (
              <React.Fragment key={index}>
                {action}
              </React.Fragment>
            ))}
          </StyledCardActions>
        </>
      )}
    </StyledCard>
  );
}

// Specialized card variants
export function InfoCard({ icon, title, value, subtitle, color = 'primary', ...props }) {
  return (
    <Card elevation={1} {...props}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {icon && (
          <div style={{ color: `var(--mui-palette-${color}-main)` }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </div>
      </div>
    </Card>
  );
}

export function MetricCard({ title, value, change, changeType, icon, ...props }) {
  const getChangeColor = () => {
    if (!change || !changeType) return 'textSecondary';
    return changeType === 'positive' ? 'success.main' : 'error.main';
  };

  const getChangeIcon = () => {
    if (!change || !changeType) return null;
    return changeType === 'positive' ? '↗' : '↘';
  };

  return (
    <Card elevation={1} {...props}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
            {value}
          </Typography>
          {change && (
            <Typography
              variant="body2"
              sx={{
                color: getChangeColor(),
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <span>{getChangeIcon()}</span>
              {change}
            </Typography>
          )}
        </div>
        {icon && (
          <div style={{ color: 'var(--mui-palette-primary-main)', opacity: 0.7 }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export default Card;