import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * 
 * A non-rendering component that automatically scrolls the viewport
 * to the top (0, 0) whenever the route changes.
 * 
 * Must be placed inside <Router> context to access location.
 * 
 * @returns {null} This component does not render anything
 */
function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // Check for window existence for SSR compatibility
    if (typeof window !== 'undefined') {
      try {
        // Scroll to top of the page
        window.scrollTo(0, 0);
      } catch (error) {
        // Handle scroll failure gracefully
        console.warn('ScrollToTop: Failed to scroll to top', error);
      }
    }
  }, [location.pathname]);

  // Return null (non-rendering component)
  return null;
}

export default ScrollToTop;
