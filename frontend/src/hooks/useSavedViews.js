import { useState, useEffect } from 'react';

const STORAGE_KEY = 'gtd-saved-views';

/**
 * Hook for managing saved views and analytics
 *
 * A saved view can be:
 * - A search query (with filters)
 * - An analytics configuration
 */
export const useSavedViews = () => {
  const [savedViews, setSavedViews] = useState([]);

  // Load saved views from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedViews(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading saved views:', err);
    }
  }, []);

  // Save to localStorage whenever views change
  const persistViews = (views) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
      setSavedViews(views);
    } catch (err) {
      console.error('Error saving views:', err);
    }
  };

  /**
   * Save a new view
   * @param {Object} view - The view to save
   * @param {string} view.name - Display name
   * @param {string} view.type - 'search' or 'analytics'
   * @param {Object} view.config - Configuration (search query, analytics settings, etc.)
   */
  const saveView = (view) => {
    const newView = {
      id: `view-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...view,
    };

    const updated = [...savedViews, newView];
    persistViews(updated);
    return newView;
  };

  /**
   * Update an existing view
   */
  const updateView = (viewId, updates) => {
    const updated = savedViews.map((view) =>
      view.id === viewId ? { ...view, ...updates, updatedAt: new Date().toISOString() } : view
    );
    persistViews(updated);
  };

  /**
   * Delete a view
   */
  const deleteView = (viewId) => {
    const updated = savedViews.filter((view) => view.id !== viewId);
    persistViews(updated);
  };

  /**
   * Toggle star/pin status
   */
  const toggleStar = (viewId) => {
    const updated = savedViews.map((view) =>
      view.id === viewId ? { ...view, starred: !view.starred } : view
    );
    persistViews(updated);
  };

  /**
   * Get starred views
   */
  const getStarredViews = () => {
    return savedViews.filter((view) => view.starred);
  };

  /**
   * Get views by type
   */
  const getViewsByType = (type) => {
    return savedViews.filter((view) => view.type === type);
  };

  return {
    savedViews,
    saveView,
    updateView,
    deleteView,
    toggleStar,
    getStarredViews,
    getViewsByType,
  };
};
