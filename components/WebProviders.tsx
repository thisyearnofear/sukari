import React from 'react';
/** Compatibility boundary kept while legacy wallet infrastructure is retired. */
const WebProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default WebProviders;
