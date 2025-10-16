# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **modular** vanilla JavaScript demo application for SmartSearch.js, designed with clear separation between generic reusable code and project-specific customizations. The architecture makes it easy to deploy the same library across multiple projects while customizing only what's necessary.

## Architecture Philosophy

### Separation of Concerns

The codebase is organized into three distinct layers:

1. **🟢 Generic Library Layer** (`lib/`) - Reusable code, same across all projects
2. **🔴 Project Configuration Layer** (`config/`) - Project-specific settings
3. **🟡 Brand Customization Layer** (`custom/`) - Optional brand styling overrides

This separation ensures that:
- New projects only need to edit ONE file (`config/project.config.js`)
- Library updates can be deployed to all projects without touching project code
- Clear boundaries between what's generic vs. what's custom

## File Structure

### 🟢 Generic Library Files (DO NOT modify per project)

**lib/smartsearch-ui.js** - Core UI library (~1000 lines)
- `SmartSearchUI` class that wraps SmartSearch functionality
- Generic search execution, pagination, faceting logic
- Settings modal (server/index configuration)
- Field inspector sidebar (debugging tool)
- Result rendering engine (supports custom templates)
- Empty/error state handlers
- Autocomplete attachment
- Event system with hooks
- **Configuration validation** (throws error if required config missing)
- **IMPORTANT:** Contains NO project-specific defaults (no URLs, no field names, no index names)
- All project-specific values MUST come from config or library will fail with helpful error

**lib/smartsearch-ui.css** - Base styles (~1000 lines)
- Modern CSS design system with custom properties
- CSS variables for easy theming (colors, spacing, borders, shadows)
- 2-column responsive grid layout
- Result card styling with hover effects
- Modal/sidebar patterns
- Mobile-responsive breakpoints
- Accessibility features

### 🔴 Project Configuration Files (CUSTOMIZE per project)

**config/project.config.js** - Single source of truth for all project settings (~150 lines)

Contains configuration objects for:

1. **Server Configuration**
   - API endpoint URL
   - Prepared search name
   - localStorage persistence keys

2. **Search Options**
   - Autocomplete settings (language, threshold, highlighting)

3. **Facet Configuration**
   - Mapping of technical field names to display names
   - Example: `'mime_type'` → `'Filetype'`

4. **Date Filter Configuration**
   - Enable/disable date filtering
   - Solr field name for dates
   - Filter query parameter name

5. **Result Field Mapping**
   - Which Solr fields map to which UI elements
   - Priority order for fallback fields
   - Date formatting preferences
   - Language display settings

6. **Feature Flags**
   - Enable/disable: settings modal, field inspector, date filter, etc.

7. **UI Customization**
   - Results per page
   - Pagination button count
   - Empty/error state messages

8. **Custom Result Template** (optional)
   - Function to completely customize result card rendering

9. **Event Hooks** (optional)
   - `beforeSearch`, `afterSearch`, `onResultClick`, etc.
   - Allows custom behavior injection without modifying library

### 🟡 Optional Brand Files (CUSTOMIZE for branding)

**custom/theme.css** - Brand-specific styling overrides
- Override CSS variables for brand colors
- Custom fonts
- Component-specific styling tweaks

### 📄 Generic HTML/Assets

**index.html** - Generic HTML structure
- Loads: smartsearch.bundle.js → config → library → initialization
- Generic DOM structure (search bar, facets container, results area)
- Inline initialization script (minimal)

**smartsearch.bundle.js** - SmartSearch library (minified)
- Official SmartSearch.js library
- Do not modify

### 📚 Documentation

**README.md** - Setup and usage guide for developers
**CLAUDE.md** - This file, architecture reference for AI assistants

## Key Data Flow

### Initialization Sequence

1. **Page Load**
   ```
   smartsearch.bundle.js loads
   ↓
   config/project.config.js loads (defines SmartSearchConfig)
   ↓
   lib/smartsearch-ui.js loads (defines SmartSearchUI class)
   ↓
   Inline script reads config and localStorage
   ↓
   Creates SmartSearch instance with config.searchOptions
   ↓
   Creates SmartSearchUI instance with SmartSearch + config
   ↓
   Attaches to window.smartSearchUI
   ↓
   window.load event → smartSearchUI.initialize()
   ```

2. **Initialize Method** (`smartSearchUI.initialize()`)
   ```
   Get search bar element
   ↓
   Attach autocomplete widget
   ↓
   Read query param from URL
   ↓
   If query exists:
       Execute search
       Render facets
       Render results
       Update results info
   Else:
       Show empty state
   ```

### Search Flow

3. **Search Execution**
   ```
   User submits query
   ↓
   beforeSearch hook (if defined)
   ↓
   fsss.search(query) API call
   ↓
   afterSearch hook (if defined)
   ↓
   Returns SearchResultPage object
   ```

4. **Result Rendering**
   ```
   beforeRender hook (if defined)
   ↓
   Check if results exist
   ↓
   If custom template:
       Call config.resultTemplate(result, highlights, uiInstance)
   Else:
       Use default card rendering with field mappings
   ↓
   For each result:
       Extract fields via config.resultFields mappings
       Create article.result-card element
       Attach field inspector button handler
       Attach result click hook (if defined)
       Append to container
   ↓
   Render pagination using SmartSearch renderer
   ↓
   Attach pagination click handlers
   ↓
   Handle "Did You Mean" suggestions
   ↓
   afterRender hook (if defined)
   ```

5. **Facet Filtering**
   ```
   User clicks facet checkbox (instant filtering)
   ↓
   Collect all checked values
   ↓
   Check date filter inputs (if enabled)
   ↓
   Build Solr date query: field:[startISO TO endISO]
   ↓
   Set custom params: fsss.setCustomParams({ fq: dateQuery })
   ↓
   Execute facet.filter(...values)
   ↓
   Re-initialize facet container
   ↓
   Re-render facets (preserves selected state)
   ↓
   Re-render results
   ↓
   Update results info
   ↓
   Smooth scroll to top (if enabled)
   ```

6. **Pagination**
   ```
   User clicks page button
   ↓
   Extract page number from button attribute
   ↓
   searchResultPage.getPage(pageNumber)
   ↓
   Re-render results for new page
   ↓
   Update results info
   ↓
   Smooth scroll to top (if enabled)
   ```

### Special Features

7. **Settings Modal**
   ```
   User clicks gear icon
   ↓
   openSettingsModal()
   ↓
   Read current settings from localStorage
   ↓
   Display modal with input fields
   ↓
   User modifies settings
   ↓
   Save to localStorage
   ↓
   Reload page (re-initializes with new settings)
   ```

8. **Field Inspector**
   ```
   User clicks three-dot menu on result card
   ↓
   openFieldsSidebar(result)
   ↓
   Create backdrop + sidebar elements
   ↓
   Display all result fields (key-value pairs)
   ↓
   Format arrays as comma-separated
   ↓
   Format objects as JSON
   ↓
   Animate sidebar in from right
   ```

## Configuration System

### How Configuration Works

The `SmartSearchUI` constructor accepts a config object that gets deep-merged with defaults:

```javascript
const ui = new SmartSearchUI(smartSearchInstance, configObject)
```

### Field Extraction System

The library provides helper methods for extracting fields from results:

**`getField(result, fieldName)`** - Extracts a field value using config mappings
- Looks up `config.resultFields[fieldName]`
- Handles single field or array of fields (priority order)
- Returns first non-null value or fallback
- Handles array values (extracts first element)

**`formatDate(result)`** - Formats date fields using config
- Extracts date field specified in config
- Formats using `toLocaleDateString()` with config.locale and format
- Returns fallback if date missing/invalid

### Result Rendering System

**Default Rendering** (no custom template):
- Uses `config.resultFields` mappings to extract: title, description, link, date, language
- Generates modern card HTML with metadata footer
- Includes field inspector button (if enabled)
- Attaches result click tracking (if hook provided)

**Custom Template Rendering** (optional):
```javascript
resultTemplate: (result, highlights, uiInstance) => {
    const title = uiInstance.getField(result, 'title')
    return `<div>${title}</div>`
}
```

## SmartSearch.js API Integration

### Methods Used

**From SmartSearch instance (`fsss`):**
- `fsss.search(query)` - Execute search, returns SearchResultPage
- `fsss.attachAutocompleteWidget(inputElement)` - Attach autocomplete
- `fsss.setCustomParams(params)` - Set custom Solr parameters (date filtering)
- `fsss.deleteCustomParams(key)` - Remove custom parameters
- `fsss.getPageRenderer(page)` - Get renderer for pagination/did-you-mean

**From SearchResultPage (`page`):**
- `page.searchResults` - Array of `{ result: {...}, highlights: {...} }` objects
- `page.facets` - Array of Facet objects
- `page.responseData` - Raw API response (numRows, highlighting, etc.)
- `page.paginationParams` - Pagination metadata
- `page.resetFacets()` - Reset all facet selections
- `page.getPage(pageNumber)` - Get specific page of results
- `page.didYouMean` - Spelling suggestions

**From Facet object:**
- `facet.name` - Technical field name
- `facet.displayName` - User-friendly name (after setDisplayName)
- `facet.counts` - Array of `{ value, count }` objects
- `facet.selectedValues` - Currently selected values
- `facet.setDisplayName(name)` - Set display name
- `facet.filter(...values)` - Apply filter, returns new SearchResultPage

## Customization Guide

### For New Projects

**Step 1: REQUIRED** - Edit `config/project.config.js`

The library will NOT work without proper configuration. It contains no project-specific defaults and will throw an error if required values are missing.

**Required Configuration:**
- Lines 15-18: Set `defaultURL` and `defaultPreparedSearch` (your API endpoint and index)
- Lines 38-43: Map facet field names to display names (if using facets)
- Lines 66-103: **CRITICAL** - Map YOUR Solr field names to UI fields:
  - `title.field` - which field contains the result title
  - `description.fields` - which fields contain result content (priority order)
  - `link.fields` - which fields contain the result URL
  - `date.field` - which field contains the date (if using date display)
  - `language.field` - which field contains language info (if displaying language)
- Line 56: Set `dateFilter.fieldName` if using date range filtering

**Step 2 (Optional):** Edit `custom/theme.css`
- Override `--primary-color` and `--accent-color` for brand colors
- Add custom fonts

**Step 3:** Open `index.html` in browser

**Important:** The `lib/` folder contains ZERO project-specific code. It cannot function without a properly configured `config/project.config.js` file.

### Common Customizations

**Change which fields are displayed:**
```javascript
// In config/project.config.js
resultFields: {
    title: { field: 'your_title_field', fallback: 'No title' },
    description: {
        fields: ['your_content_field', 'your_desc_field'],
        fallback: 'No description'
    }
}
```

**Add custom behavior on search:**
```javascript
// In config/project.config.js
hooks: {
    beforeSearch: (query) => {
        console.log('Searching for:', query)
        // Send to analytics
        return query
    },
    onResultClick: (result) => {
        // Track which results users click
    }
}
```

**Completely custom result template:**
```javascript
// In config/project.config.js
resultTemplate: (result, highlights, ui) => {
    return `
        <div class="my-custom-card">
            <h3>${result.title}</h3>
            <p>${highlights.content || result.content}</p>
            <a href="${result.link}">View</a>
        </div>
    `
}
```

**Change brand colors:**
```css
/* In custom/theme.css */
:root {
    --primary-color: #ff6b6b;
    --accent-color: #4ecdc4;
}
```

### Feature Flags

Enable/disable features without code changes:

```javascript
// In config/project.config.js
features: {
    settingsModal: false,      // Hide gear icon
    fieldInspector: false,     // Remove three-dot menus
    dateFilter: false,         // Hide date range filter
    didYouMean: false,         // Don't show suggestions
    smoothScrolling: false     // Disable smooth scroll
}
```

## Development Workflow

### Adding Features to Library

1. **Update `lib/smartsearch-ui.js`** with new functionality
2. **Add configuration options** to default config (if needed)
3. **Document in `config/project.config.js` comments**
4. **Update README.md** with usage examples
5. **Update this CLAUDE.md** with architecture changes
6. **Test across projects** before deploying

### Updating Styles

1. **Generic styles** → `lib/smartsearch-ui.css`
2. **Project colors** → `custom/theme.css`
3. **Use CSS variables** for themeable properties

### Debugging

**Field Inspector:** Click three-dot menu on any result card to see all available fields

**Browser Console:**
- `window.smartSearchUI` - Access UI instance
- `window.smartSearchUI.config` - View active configuration
- `window.smartSearchUI.currentPage` - Inspect current search results

**Common Issues:**
- **Results not rendering:** Check field mappings in config
- **Facets wrong names:** Update facet.displayNames in config
- **Date filter not working:** Verify dateFilter.fieldName matches your index
- **Styling broken:** Ensure lib/smartsearch-ui.css loads before custom/theme.css

## Technical Details

### Browser Compatibility

- Modern browsers (ES6+ required)
- Uses: arrow functions, async/await, template literals, destructuring
- CSS Grid, CSS custom properties

### No Build Process

This is a vanilla JavaScript application:
- No transpilation
- No bundling (beyond SmartSearch library)
- No package managers
- Just HTML + CSS + JS files

**Running Locally:**
Requires a web server (not file:// protocol):
- Python: `python -m http.server 8000`
- Node: `npx http-server -p 8000`
- PHP: `php -S localhost:8000`
- VS Code: Use "Live Server" extension

Then open: http://localhost:8000

### State Management

State is managed by:
- `SmartSearchUI` instance properties (currentPage, facetContainer, searchbar)
- URL query parameters (query term)
- localStorage (server settings)
- SmartSearch library internal state (facet selections)

### Performance Considerations

- Manual result rendering avoids DOM manipulation issues from SmartSearch renderer
- Event listener cleanup via node replacement (date filter listeners)
- Smooth scrolling is optional via feature flag
- Pagination limits results per page

## Notes

- Language is configurable via `searchOptions.autocomplete.language` and `resultFields.date.locale`
- Results are manually rendered instead of using SmartSearch's built-in renderer to avoid DOM issues
- The "Clear All" button resets both facets and date filters
- Empty state shown when no query parameter present
- Error state shown when search API call fails
- Settings persist to localStorage and survive page reloads
- Field inspector is useful for debugging what fields are available in results

## Migration from Old Structure

If you have an old project using the monolithic structure:

**Old → New mapping:**
- `search.js` → `lib/smartsearch-ui.js` (generic) + `config/project.config.js` (custom)
- `main.css` → `lib/smartsearch-ui.css` (base) + `custom/theme.css` (brand)
- Inline script in `index.html` → `config/project.config.js`
- Hardcoded colors → `custom/theme.css`

**Migration Steps:**
1. Copy new modular structure (lib/, config/, custom/)
2. Extract your project-specific settings into `config/project.config.js`
3. Extract your brand colors into `custom/theme.css` (optional)
4. Update `index.html` to load new structure
5. Remove old monolithic files
