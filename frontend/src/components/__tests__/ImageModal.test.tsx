import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageModal from '../ImageModal';

// Mock the react-icons to avoid import issues in tests
jest.mock('react-icons/fi', () => ({
  FiX: () => <span data-testid="close-icon">X</span>,
  FiZoomIn: () => <span data-testid="zoom-in-icon">+</span>,
  FiZoomOut: () => <span data-testid="zoom-out-icon">-</span>,
  FiDownload: () => <span data-testid="download-icon">↓</span>,
}));

describe('ImageModal', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    imageUrl: 'https://example.com/test-image.jpg',
    altText: 'Test Image',
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with image', () => {
    render(<ImageModal {...defaultProps} />);
    
    expect(screen.getByAltText('Test Image')).toBeInTheDocument();
    expect(screen.getByTestId('close-icon')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-in-icon')).toBeInTheDocument();
    expect(screen.getByTestId('download-icon')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ImageModal {...defaultProps} />);
    
    const closeButton = screen.getByTestId('close-icon').parentElement;
    fireEvent.click(closeButton!);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state initially', () => {
    render(<ImageModal {...defaultProps} />);
    
    expect(screen.getByText('Loading image...')).toBeInTheDocument();
  });

  it('handles image load success', () => {
    render(<ImageModal {...defaultProps} />);
    
    const img = screen.getByAltText('Test Image');
    fireEvent.load(img);
    
    expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
  });

  it('handles image load error', () => {
    render(<ImageModal {...defaultProps} />);
    
    const img = screen.getByAltText('Test Image');
    fireEvent.error(img);
    
    expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    expect(screen.getByText('Open in new tab instead')).toBeInTheDocument();
  });
});
