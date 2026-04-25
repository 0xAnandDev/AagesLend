import React from 'react';
import { render, screen } from '../utils/renderWithProviders';
import Dashboard from '../../pages/Dashboard';

// Mock hook dependencies
jest.mock('../../hooks/usePoolData', () => ({
  usePoolData: () => ({
    poolData: { totalSupplied: '1000', totalBorrowed: '500', apy: '5' },
    loading: false,
    error: null,
  })
}));

describe('Dashboard Page', () => {
  it('renders loading state initially or renders data directly', () => {
    // Renders the dashboard
    render(<Dashboard />);
    
    // Expect specific headings or mock data to appear
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    
    // If the mock data is rendered
    // expect(screen.getByText(/1000/i)).toBeInTheDocument();
  });
});
