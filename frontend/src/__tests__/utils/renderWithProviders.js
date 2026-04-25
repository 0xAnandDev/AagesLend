import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Note: Replace Web3Provider/Web3Context with your actual auth/web3 providers
// Example: import { Web3Provider } from '../../contexts/Web3Context';

const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      {/* <Web3Provider> */}
        {children}
      {/* </Web3Provider> */}
    </BrowserRouter>
  );
};

const renderWithProviders = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from '@testing-library/react';

// override render method
export { renderWithProviders as render };
