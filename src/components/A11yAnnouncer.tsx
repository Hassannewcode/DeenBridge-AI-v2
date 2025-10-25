import React from 'react';
import { useA11yContext } from '../contexts/A11yContext';

const A11yAnnouncer: React.FC = () => {
  const { message, key } = useA11yContext();

  return (
    <div
      key={key} // Force re-render to trigger announcement of same message
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        margin: '-1px',
        padding: '0',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      }}
    >
      {message}
    </div>
  );
};

export default A11yAnnouncer;