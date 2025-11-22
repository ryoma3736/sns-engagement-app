/**
 * ModeRatioSlider Component Tests
 *
 * Tests for the ratio slider component using React Testing Library
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeRatioSlider } from '../ModeRatioSlider';

// Mock the useStrategy hook
const mockSetImpressionRatio = jest.fn();
const mockStrategy = {
  impressionRatio: 0.9,
  expressionRatio: 0.1,
  weeklyExpressionDays: [0, 6],
  commentStrategy: {
    enabled: true,
    targetTrendingPosts: true,
    maxCommentsPerDay: 10,
    avoidNegative: true,
  },
};

const mockRatioHealth = {
  status: 'healthy' as const,
  message: '理想的な比率です。',
};

jest.mock('../../hooks/useStrategy', () => ({
  useStrategy: jest.fn((selector) => {
    const state = {
      strategy: mockStrategy,
      setImpressionRatio: mockSetImpressionRatio,
      ratioHealth: mockRatioHealth,
    };
    return selector(state);
  }),
  useRatioPercentages: jest.fn(() => ({
    impressionPercent: 90,
    expressionPercent: 10,
  })),
}));

// Import the mock to update it in tests
import { useStrategy, useRatioPercentages } from '../../hooks/useStrategy';

describe('ModeRatioSlider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    (useStrategy as jest.Mock).mockImplementation((selector) => {
      const state = {
        strategy: mockStrategy,
        setImpressionRatio: mockSetImpressionRatio,
        ratioHealth: mockRatioHealth,
      };
      return selector(state);
    });
    (useRatioPercentages as jest.Mock).mockReturnValue({
      impressionPercent: 90,
      expressionPercent: 10,
    });
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<ModeRatioSlider />);
      expect(screen.getByText('投稿モード比率')).toBeInTheDocument();
    });

    it('should display current impression percentage', () => {
      render(<ModeRatioSlider />);
      expect(screen.getByText('90%')).toBeInTheDocument();
    });

    it('should display current expression percentage', () => {
      render(<ModeRatioSlider />);
      expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('should render slider input', () => {
      render(<ModeRatioSlider />);
      const slider = screen.getByRole('slider', {
        name: /インプレッション獲得比率/i,
      });
      expect(slider).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<ModeRatioSlider className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Slider Interaction', () => {
    it('should call setImpressionRatio when slider changes', () => {
      render(<ModeRatioSlider />);
      const slider = screen.getByRole('slider');

      fireEvent.change(slider, { target: { value: '85' } });

      expect(mockSetImpressionRatio).toHaveBeenCalledWith(0.85);
    });

    it('should have correct min and max values', () => {
      render(<ModeRatioSlider />);
      const slider = screen.getByRole('slider');

      expect(slider).toHaveAttribute('min', '50');
      expect(slider).toHaveAttribute('max', '100');
    });

    it('should have current value set correctly', () => {
      render(<ModeRatioSlider />);
      const slider = screen.getByRole('slider');

      expect(slider).toHaveValue('90');
    });

    it('should update ratio when slider moves to minimum', () => {
      render(<ModeRatioSlider />);
      const slider = screen.getByRole('slider');

      fireEvent.change(slider, { target: { value: '50' } });

      expect(mockSetImpressionRatio).toHaveBeenCalledWith(0.5);
    });

    it('should update ratio when slider moves to maximum', () => {
      render(<ModeRatioSlider />);
      const slider = screen.getByRole('slider');

      fireEvent.change(slider, { target: { value: '100' } });

      expect(mockSetImpressionRatio).toHaveBeenCalledWith(1);
    });
  });

  describe('Health Status Display', () => {
    it('should display healthy status correctly', () => {
      render(<ModeRatioSlider />);
      expect(screen.getByText('理想的')).toBeInTheDocument();
    });

    it('should display healthy status message', () => {
      render(<ModeRatioSlider />);
      expect(screen.getByText('理想的な比率です。')).toBeInTheDocument();
    });

    it('should display acceptable status', () => {
      (useStrategy as jest.Mock).mockImplementation((selector) => {
        const state = {
          strategy: mockStrategy,
          setImpressionRatio: mockSetImpressionRatio,
          ratioHealth: {
            status: 'acceptable' as const,
            message: '許容範囲です。',
          },
        };
        return selector(state);
      });

      render(<ModeRatioSlider />);
      expect(screen.getByText('許容範囲')).toBeInTheDocument();
    });

    it('should display warning status', () => {
      (useStrategy as jest.Mock).mockImplementation((selector) => {
        const state = {
          strategy: mockStrategy,
          setImpressionRatio: mockSetImpressionRatio,
          ratioHealth: {
            status: 'warning' as const,
            message: '自己表現が少なすぎます。',
          },
        };
        return selector(state);
      });

      render(<ModeRatioSlider />);
      expect(screen.getByText('注意')).toBeInTheDocument();
    });

    it('should display critical status', () => {
      (useStrategy as jest.Mock).mockImplementation((selector) => {
        const state = {
          strategy: mockStrategy,
          setImpressionRatio: mockSetImpressionRatio,
          ratioHealth: {
            status: 'critical' as const,
            message: '自己表現が多すぎます。',
          },
        };
        return selector(state);
      });

      render(<ModeRatioSlider />);
      expect(screen.getByText('要改善')).toBeInTheDocument();
    });
  });

  describe('Tips Section', () => {
    it('should show tips by default', () => {
      render(<ModeRatioSlider />);
      expect(screen.getByText('インプレッション獲得モード')).toBeInTheDocument();
      expect(screen.getByText('自己表現モード')).toBeInTheDocument();
    });

    it('should hide tips when showTips is false', () => {
      render(<ModeRatioSlider showTips={false} />);
      expect(screen.queryByText('インプレッション獲得モード')).not.toBeInTheDocument();
      expect(screen.queryByText('自己表現モード')).not.toBeInTheDocument();
    });

    it('should display impression mode tips', () => {
      render(<ModeRatioSlider />);
      expect(screen.getByText(/トレンドに乗った内容を投稿/)).toBeInTheDocument();
    });

    it('should display expression mode tips', () => {
      render(<ModeRatioSlider />);
      expect(screen.getByText(/個人的な意見や感想/)).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render compact version when compact is true', () => {
      render(<ModeRatioSlider compact />);
      expect(screen.getByText('比率')).toBeInTheDocument();
      expect(screen.getByText('90:10')).toBeInTheDocument();
    });

    it('should not show full header in compact mode', () => {
      render(<ModeRatioSlider compact />);
      expect(screen.queryByText('投稿モード比率')).not.toBeInTheDocument();
    });

    it('should not show tips in compact mode', () => {
      render(<ModeRatioSlider compact />);
      expect(screen.queryByText('インプレッション獲得モード')).not.toBeInTheDocument();
    });

    it('should still have functional slider in compact mode', () => {
      render(<ModeRatioSlider compact />);
      const slider = screen.getByRole('slider');

      fireEvent.change(slider, { target: { value: '75' } });

      expect(mockSetImpressionRatio).toHaveBeenCalledWith(0.75);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible slider label', () => {
      render(<ModeRatioSlider />);
      const slider = screen.getByRole('slider', {
        name: /インプレッション獲得比率/i,
      });
      expect(slider).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<ModeRatioSlider />);
      const slider = screen.getByRole('slider');
      slider.focus();
      expect(document.activeElement).toBe(slider);
    });
  });

  describe('Visual Elements', () => {
    it('should render impression mode indicator', () => {
      render(<ModeRatioSlider />);
      expect(screen.getByText('インプレッション獲得')).toBeInTheDocument();
    });

    it('should render expression mode indicator', () => {
      render(<ModeRatioSlider />);
      expect(screen.getByText('自己表現')).toBeInTheDocument();
    });

    it('should display mode descriptions', () => {
      render(<ModeRatioSlider />);
      expect(screen.getByText('他人が聞きたいことを発信')).toBeInTheDocument();
      expect(screen.getByText('自分が言いたいことを発信')).toBeInTheDocument();
    });

    it('should display slider guidance labels', () => {
      render(<ModeRatioSlider />);
      expect(screen.getByText(/50% \(バランス\)/)).toBeInTheDocument();
      expect(screen.getByText(/推奨: 80-90%/)).toBeInTheDocument();
      expect(screen.getByText(/100% \(全てIMP\)/)).toBeInTheDocument();
    });
  });

  describe('Different Ratio Values', () => {
    it('should display 80% impression ratio correctly', () => {
      (useRatioPercentages as jest.Mock).mockReturnValue({
        impressionPercent: 80,
        expressionPercent: 20,
      });

      render(<ModeRatioSlider />);
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();
    });

    it('should display 50% ratio correctly', () => {
      (useRatioPercentages as jest.Mock).mockReturnValue({
        impressionPercent: 50,
        expressionPercent: 50,
      });

      render(<ModeRatioSlider />);
      expect(screen.getAllByText('50%')).toHaveLength(2);
    });

    it('should display 100% impression ratio correctly', () => {
      (useRatioPercentages as jest.Mock).mockReturnValue({
        impressionPercent: 100,
        expressionPercent: 0,
      });

      render(<ModeRatioSlider />);
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Compact Mode Ratio Display', () => {
    it('should show ratio in compact format', () => {
      (useRatioPercentages as jest.Mock).mockReturnValue({
        impressionPercent: 85,
        expressionPercent: 15,
      });

      render(<ModeRatioSlider compact />);
      expect(screen.getByText('85:15')).toBeInTheDocument();
    });

    it('should update compact display when ratio changes', () => {
      (useRatioPercentages as jest.Mock).mockReturnValue({
        impressionPercent: 70,
        expressionPercent: 30,
      });

      render(<ModeRatioSlider compact />);
      expect(screen.getByText('70:30')).toBeInTheDocument();
    });
  });

  describe('Status Icon Rendering', () => {
    it('should render checkmark icon for healthy status', () => {
      (useStrategy as jest.Mock).mockImplementation((selector) => {
        const state = {
          strategy: mockStrategy,
          setImpressionRatio: mockSetImpressionRatio,
          ratioHealth: {
            status: 'healthy' as const,
            message: '理想的な比率です。',
          },
        };
        return selector(state);
      });

      const { container } = render(<ModeRatioSlider />);
      const svgElements = container.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it('should render warning icon for warning status', () => {
      (useStrategy as jest.Mock).mockImplementation((selector) => {
        const state = {
          strategy: mockStrategy,
          setImpressionRatio: mockSetImpressionRatio,
          ratioHealth: {
            status: 'warning' as const,
            message: '注意が必要です。',
          },
        };
        return selector(state);
      });

      const { container } = render(<ModeRatioSlider />);
      const svgElements = container.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });
  });

  describe('Color Coding', () => {
    it('should apply emerald colors for healthy status', () => {
      (useStrategy as jest.Mock).mockImplementation((selector) => {
        const state = {
          strategy: mockStrategy,
          setImpressionRatio: mockSetImpressionRatio,
          ratioHealth: {
            status: 'healthy' as const,
            message: '理想的な比率です。',
          },
        };
        return selector(state);
      });

      const { container } = render(<ModeRatioSlider />);
      const healthBadge = container.querySelector('.bg-emerald-500\\/20');
      expect(healthBadge).toBeInTheDocument();
    });

    it('should apply red colors for critical status', () => {
      (useStrategy as jest.Mock).mockImplementation((selector) => {
        const state = {
          strategy: mockStrategy,
          setImpressionRatio: mockSetImpressionRatio,
          ratioHealth: {
            status: 'critical' as const,
            message: '改善が必要です。',
          },
        };
        return selector(state);
      });

      const { container } = render(<ModeRatioSlider />);
      const healthBadge = container.querySelector('.bg-red-500\\/20');
      expect(healthBadge).toBeInTheDocument();
    });
  });
});

describe('ModeRatioSlider Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should work with different initial values', () => {
    const testCases = [
      { impression: 90, expression: 10 },
      { impression: 80, expression: 20 },
      { impression: 50, expression: 50 },
      { impression: 100, expression: 0 },
    ];

    testCases.forEach(({ impression, expression }) => {
      (useRatioPercentages as jest.Mock).mockReturnValue({
        impressionPercent: impression,
        expressionPercent: expression,
      });

      const { unmount } = render(<ModeRatioSlider />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue(impression.toString());
      unmount();
    });
  });

  it('should handle multiple slider changes', () => {
    render(<ModeRatioSlider />);
    const slider = screen.getByRole('slider');

    // Simulate multiple slider changes
    fireEvent.change(slider, { target: { value: '60' } });
    fireEvent.change(slider, { target: { value: '70' } });
    fireEvent.change(slider, { target: { value: '80' } });

    // Each change should trigger setImpressionRatio at least once
    expect(mockSetImpressionRatio).toHaveBeenCalled();
    expect(mockSetImpressionRatio.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
