import React from 'react';

export default function ContentCard({ children, className = '', style = {} }) {
  return (
    <div 
      className={`content-card ${className}`}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '0px', /* Square geometry */
        boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.4), 0 4px 6px -4px rgba(15, 23, 42, 0.4)', /* Dark color box shadow */
        padding: '24px',
        border: '1px solid #e2e8f0',
        ...style
      }}
    >
      {children}
    </div>
  );
}
