# SmartSearch Vanilla JS Demo - Modular Version

## 🎬 Demo Showcase

https://github.com/user-attachments/assets/intro.mp4

<video src="public/intro.mp4" controls style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></video>

---

A modular, reusable SmartSearch interface with clear separation between generic library code and project-specific customizations.

## 📁 Project Structure

```
project-root/
├── lib/                            # 🟢 GENERIC (100% reusable, zero project-specific code)
│   ├── smartsearch-ui.js          # Core UI library (NO defaults for URLs/fields)
│   └── smartsearch-ui.css         # Base styles (generic design system)
│
├── config/                         # 🔴 PROJECT-SPECIFIC (ALL customization here)
│   └── project.config.js          # Required: server URL, field mappings, etc.
│
├── custom/                         # 🟡 OPTIONAL (brand overrides)
│   └── theme.css                  # Brand colors, fonts, etc.
│
├── index.html                      # Generic HTML structure
├── smartsearch.bundle.js           # SmartSearch library
├── CLAUDE.md                       # Architecture documentation
└── README.md                       # This file
```

## 🚀 Quick Start

### For New Projects

1. **Copy this project** as a template
2. **Edit `config/project.config.js`** (**REQUIRED** - library will not work without this):
   - Set your `defaultURL` and `defaultPreparedSearch` (lines 15-18)
   - Configure facet display names (lines 38-43)
   - **Map your PreparedSearch field names** to result fields (lines 66-103)
   - Configure date field name if using date filter (line 56)
   - Enable/disable features as needed (lines 110-118)
3. **Optional: Customize `custom/theme.css`** with brand colors
4. **Run a local web server** (see below)

**Note:** The library contains NO project-specific defaults. All URLs, index names, and field mappings MUST be provided in the config file or the library will throw an error.

## 🌐 Running Locally

This is a static HTML/CSS/JS application that needs to be served via HTTP (not opened directly as a file).

### Quick Start - Choose One:

**Python (if installed):**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Node.js (if installed):**
```bash
# Using npx (no installation needed)
npx http-server -p 8000

# Or install globally
npm install -g http-server
http-server -p 8000
```

**PHP (if installed):**
```bash
php -S localhost:8000
```

**VS Code (recommended):**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

Then open: **http://localhost:8000**

### Why a web server is needed:
- JavaScript module loading requires HTTP/HTTPS protocol
- Prevents CORS issues when loading local files
- Mimics production environment accurately

## 📝 Configuration Guide

All project-specific settings live in **`config/project.config.js`**. Here's what you can configure:

### Server Settings
```javascript
server: {
    defaultURL: 'https://your-api-endpoint.com',
    defaultPreparedSearch: 'YourIndexName'
}
```

### Facet Display Names
```javascript
facets: {
    displayNames: {
        'technical_field_name': 'User-Friendly Name',
        'mime_type': 'File Type',
        'category': 'Category'
    }
}
```

### Result Field Mapping
```javascript
resultFields: {
    title: {
        field: 'title',  // Solr field name
        fallback: 'Untitled'
    },
    description: {
        fields: ['content', 'description', 'text'],  // Try in order
        fallback: 'No description',
        useHighlighting: true
    }
}
```

### Feature Flags
```javascript
features: {
    settingsModal: true,      // Enable gear icon settings
    fieldInspector: true,     // Enable result field inspector
    dateFilter: true,         // Enable date range filtering
    instantFiltering: true,   // Filter on checkbox change
    didYouMean: true,         // Show suggestions
    smoothScrolling: true     // Smooth scroll on pagination
}
```

### Custom Result Template (Advanced)
```javascript
resultTemplate: (result, highlights, uiInstance) => {
    const title = uiInstance.getField(result, 'title')
    const link = uiInstance.getField(result, 'link')

    return `
        <a href="${link}">
            <h2>${title}</h2>
        </a>
    `
}
```

### Event Hooks
```javascript
hooks: {
    beforeSearch: (query) => {
        console.log('Searching:', query)
        return query
    },
    afterSearch: (page) => {
        console.log('Results:', page.searchResults.length)
        return page
    },
    onResultClick: (result) => {
        // Track analytics
    }
}
```

## 🎨 Theming

Brand-specific styling goes in **`custom/theme.css`**:

```css
:root {
    /* Override default colors */
    --primary-color: #YOUR-BRAND-COLOR;
    --accent-color: #YOUR-ACCENT-COLOR;

    /* Custom font */
    font-family: 'Your-Brand-Font', sans-serif;
}

/* Custom component styling */
.result-card {
    /* Your custom styles */
}
```

## 🔧 Library API

If you need programmatic access to the search interface:

```javascript
// Access the UI instance
const ui = window.smartSearchUI

// Execute a search
const results = await ui.search('query')

// Render results
ui.renderSearchResults(results)

// Open settings modal
ui.openSettingsModal()

// Show field inspector
ui.openFieldsSidebar(result)

// Get configured field value
const title = ui.getField(result, 'title')

// Format a date
const formattedDate = ui.formatDate(result)
```

## 📦 What's Generic vs. Project-Specific?

### 🟢 Generic (in `lib/`) - 100% Reusable, ZERO Project Code
- SmartSearch API interaction logic
- Search, pagination, facets, autocomplete handlers
- Settings modal UI (loads values from config)
- Field inspector sidebar (debugging tool)
- Empty/error state rendering
- Base UI components and styling (uses CSS variables)
- Responsive layout system
- Configuration validation (ensures required values provided)
- **NO hardcoded URLs, NO field names, NO index names**

### 🔴 Project-Specific (in `config/`) - REQUIRED for each project
- **Server URL** (e.g., 'https://your-api.com')
- **Index name** (e.g., 'YourSearchIndex')
- **Facet field mappings** (technical name → display name)
- **Result field mappings** (which Solr fields to display)
- **Date field name** (e.g., 'meta_date', 'publish_date')
- Feature enable/disable flags
- Custom result templates (optional)
- Event hooks for analytics (optional)

### 🟡 Optional (in `custom/`) - Brand customization
- Brand colors
- Custom fonts
- Logo styling
- Component overrides

## 🆕 For New Developers

**To customize for a new project:**

1. Open `config/project.config.js`
2. Update server settings (lines 15-16)
3. Update facet display names (lines 38-43)
4. Adjust result field mappings if needed (lines 66-103)
5. Optional: Add brand colors to `custom/theme.css`
6. **That's it!** Don't touch `lib/` folder.

## 🔄 Updating the Library

When a new version of the library is released:

1. Replace `lib/smartsearch-ui.js` and `lib/smartsearch-ui.css`
2. Check `config/project.config.js` for new options
3. Test your project
4. Deploy

Your project-specific settings in `config/` remain unchanged!

## 🐛 Troubleshooting

### Search not working?
- Check browser console for errors
- Verify server URL in settings modal (gear icon)
- Ensure prepared search name is correct

### Results not displaying correctly?
- Check field mappings in `config/project.config.js`
- Use field inspector (three-dot menu) to see available fields
- Adjust `resultFields` configuration

### Styling looks wrong?
- Ensure `lib/smartsearch-ui.css` is loaded
- Check `custom/theme.css` for conflicting overrides
- Use browser dev tools to inspect CSS

## 📚 Further Reading

- **CLAUDE.md** - Detailed architecture documentation
- **config/project.config.js** - Inline configuration comments
- **lib/smartsearch-ui.js** - Library source code with JSDoc

## 🤝 Contributing

When improving the library:

1. **Generic improvements** → Update `lib/` folder
2. **Project-specific changes** → Update `config/` folder
3. **Document changes** → Update this README and CLAUDE.md

## 📜 Version History

**v1.0 - Modular Architecture**
- Refactored from monolithic structure to modular design
- Separated generic library code (`lib/`) from project configuration (`config/`)
- Added configuration validation to ensure library remains 100% generic
- All project-specific code now lives in single config file

## 📄 License & Disclaimer

**Private Test Project** - This is a personal/experimental project by Thomas Ritter.

**✅ Free to Use:**
- **Free for anyone to use, modify, and distribute**
- **No restrictions** - do whatever you want with this code
- **No attribution required**

**⚠️ Important:**
- **NOT an official Crownpeak product or reference implementation**
- **NO official support provided**
- **NO warranty or guarantees**
- Provided "as-is" for educational and testing purposes
- Use at your own risk

This project demonstrates SmartSearch.js integration but is not endorsed by or affiliated with Crownpeak/FirstSpirit as an official example.

---

**Questions?** Check CLAUDE.md for architecture details or examine the configuration file comments.
