import React from 'react';

const ValidationError = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="invalid-feedback d-block">
      {error}
    </div>
  );
};

export default ValidationError;