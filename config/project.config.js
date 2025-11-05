/**
 * SmartSearch Project Configuration
 *
 * ⚠️ REQUIRED: This file contains ALL project-specific settings.
 *
 * The library in lib/ contains NO project-specific defaults and will
 * throw an error if required configuration values are missing.
 *
 * IMPORTANT: You MUST provide:
 * - server.defaultURL (your API endpoint)
 * - server.defaultPreparedSearch (your search index name)
 * - resultFields mappings (YOUR Solr field names)
 * - dateFilter.fieldName (if using date filtering)
 *
 * @see lib/smartsearch-ui.js for the generic library code
 */

const SmartSearchConfig = {
    // ========================================
    // SERVER CONFIGURATION (REQUIRED)
    // ========================================
    server: {
        // ⚠️ REQUIRED: Your SmartSearch API endpoint
        // The library has NO default - you MUST set this
        defaultURL: 'https://professional-services-dev-search-api.e-spirit.cloud',

        // ⚠️ REQUIRED: Your prepared search/index name
        // The library has NO default - you MUST set this
        defaultPreparedSearch: 'CrownpeakDocs',

        // LocalStorage keys for persisting settings
        localStorageKeys: {
            server: 'smartsearch-server',
            preparedSearch: 'smartsearch-prepared-search'
        }
    },

    // ========================================
    // THEME CONFIGURATION
    // ========================================
    theme: {
        // Enable theme switching
        enabled: true,

        // Default theme to load
        default: localStorage.getItem('smartsearch-theme') || 'default',

        // Available themes
        available: [
            {
                id: 'default',
                name: 'Default',
                description: 'Professional light theme'
            },
            {
                id: 'minimal',
                name: 'Minimal Zen',
                description: 'Japanese-inspired minimalist'
            },
            {
                id: 'magazine',
                name: 'Magazine',
                description: 'Editorial with top filters & grid'
            }
        ],

        // LocalStorage key for theme persistence
        localStorageKey: 'smartsearch-theme'
    },

    // ========================================
    // SEARCH OPTIONS
    // ========================================
    searchOptions: {
        autocomplete: {
            highlight: true,
            language: 'en',
            prefixThreshold: 3
        }
    },

    // ========================================
    // FACET CONFIGURATION
    // ========================================
    facets: {
        // Map technical facet names to user-friendly display names
        displayNames: {
            'mime_type': 'Filetype',
            'category': 'Category',
            'facet_filter_language': 'Language'
        }
    },

    // ========================================
    // DATE FILTERING
    // ========================================
    dateFilter: {
        // Enable/disable date range filtering
        enabled: true,

        // ⚠️ REQUIRED if enabled: YOUR Solr date field name
        // (e.g., 'meta_date', 'publish_date', 'created_date')
        fieldName: 'meta_date',

        // Solr filter query parameter name
        solrFilterParam: 'fq',

        // NEW: Preset date range options
        presets: {
            enabled: true,
            options: [
                { label: 'Last 3 Days', days: 3 },
                { label: 'Last Week', days: 7 },
                { label: 'Last Month', days: 30 },
                { label: 'Last 3 Months', days: 90 },
                { label: 'Last 6 Months', days: 180 },
                { label: 'Last Year', days: 365 }
            ]
        }
    },

    // ========================================
    // RESULT FIELD MAPPING (REQUIRED)
    // ========================================
    // ⚠️ CRITICAL: Map YOUR Solr field names here!
    // The library has NO field defaults - you MUST provide these.
    resultFields: {
        // ⚠️ REQUIRED: Which field contains the result title?
        title: {
            field: 'title',  // Change this to YOUR title field
            fallback: 'Untitled'
        },

        // ⚠️ REQUIRED: Which fields contain result content? (tries in order)
        description: {
            fields: ['content', 'description', 'text'],  // Change to YOUR fields
            fallback: 'No description available',
            useHighlighting: true
        },

        // ⚠️ REQUIRED: Which fields contain the result URL?
        link: {
            fields: ['link', 'url'],  // Change to YOUR link fields
            fallback: '#'
        },

        // Date field configuration
        date: {
            field: 'meta_date',
            format: {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            },
            locale: 'en',
            fallback: 'No date'
        },

        // Language field configuration
        language: {
            field: 'language_keyword',
            default: 'EN'
        }
    },

    // ========================================
    // FEATURE FLAGS
    // ========================================
    features: {
        // Enable settings modal (gear icon)
        settingsModal: true,

        // Enable field inspector (three-dot menu on result cards)
        fieldInspector: true,

        // Enable date range filtering
        dateFilter: true,

        // Enable instant filtering (no "Apply" button needed)
        instantFiltering: true,

        // Show "Did You Mean" suggestions
        didYouMean: true,

        // Enable smooth scrolling when paginating/filtering
        smoothScrolling: true
    },

    // ========================================
    // UI CUSTOMIZATION
    // ========================================
    ui: {
        // Number of results per page
        resultsPerPage: 10,

        // Maximum number of pagination buttons to show
        maxPaginationButtons: 5,

        // Show result count above results
        showResultCount: true,

        // Empty state message (when no query)
        emptyStateMessage: 'Enter a search query to get started',
        emptyStateIcon: '🔍',

        // Error state icon
        errorStateIcon: '⚠️'
    },

    // ========================================
    // CUSTOM RESULT TEMPLATE (Optional)
    // ========================================
    // If you want to completely customize how results are rendered,
    // uncomment and modify this function:
    /*
    resultTemplate: (result, highlights, uiInstance) => {
        // Access configured fields via: uiInstance.getField(result, 'title')
        const title = uiInstance.getField(result, 'title')
        const description = uiInstance.getField(result, 'description')
        const link = uiInstance.getField(result, 'link')
        const date = uiInstance.formatDate(result)

        return `
            <a href="${link}" target="_blank" rel="noopener noreferrer" class="result-link">
                <div class="result-header">
                    <h2 class="result-title">${title}</h2>
                </div>
                <div class="result-content">
                    <p class="result-description">${description}</p>
                </div>
                <div class="result-footer">
                    <span class="result-date">${date}</span>
                </div>
            </a>
        `
    },
    */

    // ========================================
    // HOOKS (Advanced Customization)
    // ========================================
    hooks: {
        /**
         * Called before executing a search
         * Allows you to modify the query
         */
        beforeSearch: (query) => {
            // Example: Log searches for analytics
            // console.log('Searching for:', query)
            return query
        },

        /**
         * Called after receiving search results
         * Allows you to process/modify results
         */
        afterSearch: (page) => {
            // Example: Add custom data to results
            // console.log('Received', page.searchResults.length, 'results')
            return page
        },

        /**
         * Called when a result is clicked
         * Useful for analytics tracking
         */
        onResultClick: (result) => {
            // Example: Track result clicks
            // console.log('Result clicked:', result.title)
        },

        /**
         * Called before rendering results
         */
        beforeRender: (page) => {
            return page
        },

        /**
         * Called after rendering results
         */
        afterRender: (page) => {
            // Example: Initialize custom UI components
        }
    }
}
