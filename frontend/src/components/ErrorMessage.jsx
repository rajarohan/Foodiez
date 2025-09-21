import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

const ErrorMessage = ({ 
  error = 'An unexpected error occurred', 
  onRetry = null, 
  onDismiss = null,
  variant = 'danger',
  showIcon = true,
  className = '',
  fullWidth = true
}) => {
  const getErrorMessage = () => {
    if (typeof error === 'string') {
      return error;
    }
    if (error?.message) {
      return error.message;
    }
    if (error?.data?.message) {
      return error.data.message;
    }
    return 'An unexpected error occurred';
  };

  const containerClasses = fullWidth ? 'w-100' : '';

  return (
    <div className={`alert alert-${variant} alert-dismissible ${containerClasses} ${className}`} role="alert">
      <div className="d-flex align-items-start">
        {showIcon && (
          <AlertTriangle size={20} className="me-2 mt-1 flex-shrink-0" />
        )}
        <div className="flex-grow-1">
          <div className="fw-bold">Error</div>
          <div>{getErrorMessage()}</div>
          {onRetry && (
            <button 
              className="btn btn-sm btn-outline-danger mt-2"
              onClick={onRetry}
            >
              <RefreshCw size={16} className="me-1" />
              Retry
            </button>
          )}
        </div>
        {onDismiss && (
          <button 
            type="button" 
            className="btn-close" 
            onClick={onDismiss}
            aria-label="Close"
          >
          </button>
        )}
      </div>
    </div>
  );
};

// Specific error components for common use cases
export const NetworkError = ({ onRetry }) => (
  <ErrorMessage 
    error="Network connection failed. Please check your internet connection."
    onRetry={onRetry}
    variant="warning"
  />
);

export const NotFound = ({ message = 'The requested content was not found.' }) => (
  <div className="text-center py-5">
    <AlertTriangle size={64} className="text-muted mb-3" />
    <h4 className="text-muted">Not Found</h4>
    <p className="text-muted">{message}</p>
  </div>
);

export const ServerError = ({ onRetry }) => (
  <ErrorMessage 
    error="Server error occurred. Please try again later."
    onRetry={onRetry}
    variant="danger"
  />
);

export const ValidationError = ({ errors = [], onDismiss }) => {
  const errorList = Array.isArray(errors) ? errors : [errors];
  
  return (
    <div className="alert alert-danger" role="alert">
      <div className="d-flex align-items-start">
        <AlertTriangle size={20} className="me-2 mt-1 flex-shrink-0" />
        <div className="flex-grow-1">
          <div className="fw-bold">Please correct the following errors:</div>
          <ul className="mb-0 mt-2">
            {errorList.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button 
            type="button" 
            className="btn-close" 
            onClick={onDismiss}
            aria-label="Close"
          >
          </button>
        )}
      </div>
    </div>
  );
};

export const EmptyState = ({ 
  title = 'No data available', 
  message = 'There is no data to display at the moment.',
  action = null
}) => (
  <div className="text-center py-5">
    <div className="mb-3">
      <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" 
           style={{ width: '80px', height: '80px' }}>
        <AlertTriangle size={32} className="text-muted" />
      </div>
    </div>
    <h5 className="text-muted">{title}</h5>
    <p className="text-muted">{message}</p>
    {action}
  </div>
);

export default ErrorMessage;