import React from 'react';

const Loading = ({ 
  size = 'md', 
  color = 'primary', 
  text = 'Loading...', 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  };

  const containerClasses = fullScreen 
    ? 'd-flex justify-content-center align-items-center min-vh-100'
    : 'd-flex justify-content-center align-items-center p-3';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div 
          className={`spinner-border text-${color} ${sizeClasses[size]}`} 
          role="status"
          style={{ width: size === 'lg' ? '3rem' : undefined, height: size === 'lg' ? '3rem' : undefined }}
        >
          <span className="visually-hidden">{text}</span>
        </div>
        {text && (
          <div className={`mt-2 text-${color}`}>
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

// Specific loading components for common use cases
export const PageLoading = ({ text = 'Loading page...' }) => (
  <Loading fullScreen={true} text={text} size="lg" />
);

export const ButtonLoading = ({ text = '' }) => (
  <div className="d-flex align-items-center">
    <div className="spinner-border spinner-border-sm me-2" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    {text}
  </div>
);

export const CardLoading = () => (
  <div className="card">
    <div className="card-body text-center p-4">
      <Loading size="md" text="Loading..." />
    </div>
  </div>
);

export const TableLoading = ({ columns = 4 }) => (
  <tr>
    <td colSpan={columns} className="text-center p-4">
      <Loading size="md" text="Loading data..." />
    </td>
  </tr>
);

export default Loading;