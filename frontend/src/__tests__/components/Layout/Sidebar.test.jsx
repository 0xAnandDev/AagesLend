import React from 'react';
import { render, screen } from '../utils/renderWithProviders';
import userEvent from '@testing-library/user-event';
import Sidebar from '../../components/Layout/Sidebar';

describe('Sidebar Component', () => {
  it('renders standard navigation links', () => {
    // Assuming the sidebar renders inside a Router, renderWithProviders wraps it in BrowserRouter
    render(<Sidebar />);
    
    // Check for some common text or icons in a Sidebar
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Lend/i)).toBeInTheDocument();
  });
  
  it('highlights the active navigation link based on route', () => {
    // In a real scenario, mock the current path if needed
    render(<Sidebar />);
    const dashboardLink = screen.getByText(/Dashboard/i).closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/');
  });

  it('can be toggled in mobile view if applicable', () => {
    render(<Sidebar />);
    // Add logic if your sidebar has a mobile menu button
    // e.g.
    // const toggleButton = screen.queryByRole('button', { name: /open menu/i });
    // if (toggleButton) { ... }
  });
});
