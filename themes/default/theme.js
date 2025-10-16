/**
 * Default Theme Module
 *
 * This theme preserves the original SmartSearch UI behavior.
 * It provides no component overrides, using the library's default rendering.
 *
 * Theme Characteristics:
 * - Professional light theme
 * - Checkbox-based facets
 * - Card-style results
 * - Clean, modern aesthetic
 */

window.SmartSearchThemes = window.SmartSearchThemes || {};

window.SmartSearchThemes.default = {
    name: 'Default',
    description: 'Professional light theme with checkbox filters',
    cssFile: 'themes/default/theme.css',

    /**
     * Component overrides
     * Default theme uses library's built-in rendering, so no overrides needed
     */
    components: {},

    /**
     * Event handlers
     * Default theme uses library's built-in handlers
     */
    eventHandlers: {},

    /**
     * Initialize theme
     * Called when theme is activated
     */
    init(uiInstance) {
        console.log('[Theme] Default theme initialized');
    },

    /**
     * Cleanup theme
     * Called when switching away from this theme
     */
    destroy(uiInstance) {
        console.log('[Theme] Default theme cleaned up');
    }
};
