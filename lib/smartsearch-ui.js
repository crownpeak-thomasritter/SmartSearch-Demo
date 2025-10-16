/**
 * SmartSearch UI Library
 * Generic, reusable SmartSearch interface components
 *
 * @version 1.0.0
 * @description Core library for building SmartSearch-powered search interfaces
 *
 * IMPORTANT: This library contains NO project-specific defaults!
 * - NO hardcoded server URLs
 * - NO hardcoded index names
 * - NO hardcoded field names
 *
 * All project-specific configuration MUST be provided via the config parameter.
 * The library will throw a validation error if required configuration is missing.
 *
 * This ensures the library is 100% generic and reusable across all projects.
 */

class SmartSearchUI {
    constructor(smartSearchInstance, config = {}) {
        this.fsss = smartSearchInstance
        this.config = this._mergeConfig(config)
        this.searchbar = null
        this.facetContainer = null
        this.currentPage = null

        // Theme system
        this.currentTheme = null
        this.themeRegistry = window.SmartSearchThemes || {}
        this.loadedThemeCSS = []

        // Validate required configuration
        this._validateConfig()

        // Load theme
        const themeId = this.config.theme?.default || 'default'
        this._loadTheme(themeId)

        this._init()
    }

    /**
     * Validate that required configuration is provided
     * @throws {Error} if required config is missing
     */
    _validateConfig() {
        const required = []

        if (!this.config.server.defaultURL) {
            required.push('server.defaultURL')
        }
        if (!this.config.server.defaultPreparedSearch) {
            required.push('server.defaultPreparedSearch')
        }

        // Check result field mappings
        if (!this.config.resultFields.title.field) {
            required.push('resultFields.title.field')
        }
        if (!this.config.resultFields.description.fields || this.config.resultFields.description.fields.length === 0) {
            required.push('resultFields.description.fields')
        }
        if (!this.config.resultFields.link.fields || this.config.resultFields.link.fields.length === 0) {
            required.push('resultFields.link.fields')
        }

        if (this.config.dateFilter.enabled && !this.config.dateFilter.fieldName) {
            required.push('dateFilter.fieldName (required when dateFilter.enabled = true)')
        }

        if (required.length > 0) {
            throw new Error(
                `SmartSearchUI: Missing required configuration:\n  - ${required.join('\n  - ')}\n\n` +
                `Please provide these values in config/project.config.js`
            )
        }
    }

    /**
     * Merge user config with defaults
     *
     * DESIGN NOTE: Only truly generic defaults are provided here.
     * All project-specific values (URLs, field names, etc.) are set to null
     * and MUST be provided via the config parameter.
     */
    _mergeConfig(userConfig) {
        const defaults = {
            server: {
                // REQUIRED in config - NO DEFAULTS
                defaultURL: null,  // e.g., 'https://your-api.com'
                defaultPreparedSearch: null,  // e.g., 'YourIndexName'
                localStorageKeys: {
                    server: 'smartsearch-server',
                    preparedSearch: 'smartsearch-prepared-search'
                }
            },
            facets: {
                displayNames: {}
            },
            dateFilter: {
                enabled: true,
                fieldName: null,  // Must be provided in config
                solrFilterParam: 'fq'  // Solr standard
            },
            resultFields: {
                // Field mappings must be provided in config
                // These are just structure examples showing the expected format
                title: { field: null, fallback: 'Untitled' },
                description: {
                    fields: [],  // e.g., ['content', 'description', 'text']
                    fallback: 'No description available',
                    useHighlighting: true
                },
                link: { fields: [], fallback: '#' },  // e.g., ['link', 'url']
                date: {
                    field: null,  // e.g., 'meta_date', 'date', 'publish_date'
                    format: { year: 'numeric', month: 'short', day: 'numeric' },
                    locale: 'en',
                    fallback: 'No date'
                },
                language: { field: null, default: 'EN' }  // e.g., 'language_keyword'
            },
            features: {
                settingsModal: true,
                fieldInspector: true,
                dateFilter: true,
                instantFiltering: true,
                didYouMean: true,
                smoothScrolling: true
            },
            ui: {
                resultsPerPage: 10,
                maxPaginationButtons: 5,
                showResultCount: true,
                emptyStateMessage: 'Enter a search query to get started',
                emptyStateIcon: '🔍',
                errorStateIcon: '⚠️'
            },
            hooks: {
                beforeSearch: null,
                afterSearch: null,
                onResultClick: null,
                beforeRender: null,
                afterRender: null
            },
            resultTemplate: null
        }

        return this._deepMerge(defaults, userConfig)
    }

    /**
     * Deep merge two objects
     */
    _deepMerge(target, source) {
        const output = Object.assign({}, target)
        if (this._isObject(target) && this._isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this._isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] })
                    } else {
                        output[key] = this._deepMerge(target[key], source[key])
                    }
                } else {
                    Object.assign(output, { [key]: source[key] })
                }
            })
        }
        return output
    }

    _isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item)
    }

    /**
     * Load a theme
     */
    _loadTheme(themeId) {
        const theme = this.themeRegistry[themeId]

        if (!theme) {
            console.warn(`[SmartSearchUI] Theme '${themeId}' not found, using default`)
            return
        }

        // Unload current theme if one exists
        if (this.currentTheme) {
            this._unloadTheme()
        }

        // Load theme CSS
        if (theme.cssFile) {
            this._loadThemeCSS(theme.cssFile, themeId)
        }

        // Store theme reference
        this.currentTheme = theme
        this.currentThemeId = themeId

        // Apply theme class to body (wait for DOM if needed)
        this._applyThemeClass(themeId)

        console.log(`[SmartSearchUI] Theme '${themeId}' loaded successfully`)
    }

    /**
     * Apply theme class to body element
     * Waits for DOM to be ready if body doesn't exist yet
     */
    _applyThemeClass(themeId) {
        const applyClass = () => {
            if (document.body) {
                document.body.classList.add(`theme-${themeId}`)

                // Run theme initialization after class is applied
                if (this.currentTheme?.init) {
                    this.currentTheme.init(this)
                }
            }
        }

        // If body exists, apply immediately
        if (document.body) {
            applyClass()
        } else {
            // Otherwise, wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', applyClass)
            } else {
                // DOM is already loaded but body doesn't exist - shouldn't happen, but handle it
                applyClass()
            }
        }
    }

    /**
     * Unload current theme
     */
    _unloadTheme() {
        if (!this.currentTheme) return

        // Run theme cleanup
        if (this.currentTheme.destroy) {
            this.currentTheme.destroy(this)
        }

        // Remove theme class from body (if body exists)
        if (document.body && this.currentThemeId) {
            document.body.classList.remove(`theme-${this.currentThemeId}`)
        }

        // Remove theme CSS
        this.loadedThemeCSS.forEach(link => {
            if (link.parentNode) {
                link.parentNode.removeChild(link)
            }
        })
        this.loadedThemeCSS = []

        this.currentTheme = null
        this.currentThemeId = null
    }

    /**
     * Switch to a different theme
     */
    switchTheme(themeId) {
        // Save to localStorage
        if (this.config.theme?.localStorageKey) {
            localStorage.setItem(this.config.theme.localStorageKey, themeId)
        }

        // Load new theme
        this._loadTheme(themeId)

        // Re-render if we have a current page
        if (this.currentPage) {
            this.renderAllFacets(this.currentPage)
            this.renderSearchResults(this.currentPage)
        }
    }

    /**
     * Load theme CSS dynamically
     */
    _loadThemeCSS(cssFile, themeId) {
        // Check if already loaded
        const existing = document.querySelector(`link[data-theme="${themeId}"]`)
        if (existing) {
            return
        }

        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.type = 'text/css'
        link.href = cssFile
        link.setAttribute('data-theme', themeId)

        document.head.appendChild(link)
        this.loadedThemeCSS.push(link)
    }

    /**
     * Convert HTML string to DOM element
     */
    _htmlToElement(html) {
        const template = document.createElement('template')
        template.innerHTML = html.trim()
        return template.content.firstChild
    }

    /**
     * Initialize UI components
     */
    _init() {
        if (this.config.features.settingsModal) {
            this._initSettingsButton()
        }
    }

    /**
     * Initialize the search interface
     * Call this on page load
     */
    async initialize() {
        this.searchbar = document.getElementById("search-bar")

        if (this.searchbar) {
            this.fsss.attachAutocompleteWidget(this.searchbar)
        }

        const queryString = window.location.search
        const urlParams = new URLSearchParams(queryString)
        const queryTerm = urlParams.get("query")

        if (queryTerm) {
            const page = await this.search(queryTerm)

            if (page) {
                this.currentPage = page

                if (page.facets) {
                    this.initFacetContainer(page)
                    this.renderAllFacets(page)
                }

                this.renderSearchResults(page)
                this.updateResultsInfo(page, queryTerm)
            }
        } else {
            this.showEmptyState()
        }
    }

    /**
     * Execute a search
     */
    async search(query) {
        try {
            // Before search hook
            if (this.config.hooks.beforeSearch) {
                query = this.config.hooks.beforeSearch(query)
            }

            let page = await this.fsss.search(query)

            // After search hook
            if (this.config.hooks.afterSearch) {
                page = this.config.hooks.afterSearch(page)
            }

            return page
        } catch (error) {
            console.error('Search error:', error)
            this.showErrorState(error)
            return null
        }
    }

    /**
     * Get field value from result with fallback logic
     */
    getField(result, fieldName) {
        const fieldConfig = this.config.resultFields[fieldName]
        if (!fieldConfig) return null

        // Handle single field
        if (fieldConfig.field) {
            const value = result[fieldConfig.field]
            if (value) {
                return Array.isArray(value) ? value[0] : value
            }
            return fieldConfig.fallback || null
        }

        // Handle multiple fields (priority order)
        if (fieldConfig.fields) {
            for (const field of fieldConfig.fields) {
                const value = result[field]
                if (value) {
                    return Array.isArray(value) ? value[0] : value
                }
            }
            return fieldConfig.fallback || null
        }

        return null
    }

    /**
     * Format date from result
     */
    formatDate(result) {
        const dateConfig = this.config.resultFields.date
        const dateValue = result[dateConfig.field]

        if (!dateValue) return dateConfig.fallback

        try {
            return new Date(dateValue).toLocaleDateString(
                dateConfig.locale,
                dateConfig.format
            )
        } catch (e) {
            console.error('Date parsing error:', e)
            return dateConfig.fallback
        }
    }

    /**
     * Initialize facet container
     */
    initFacetContainer(page) {
        this.facetContainer = document.getElementById("facets-container")

        if (!this.facetContainer) {
            console.warn("Facets container element not found")
            return
        }

        this.facetContainer.innerHTML = ""

        // Hook up reset all button
        const resetAllButton = document.getElementById("reset-all-facets-btn")
        if (resetAllButton) {
            resetAllButton.onclick = async () => {
                // Clear date inputs
                if (this.config.dateFilter.enabled) {
                    const startDateInput = document.getElementById("start-date")
                    const endDateInput = document.getElementById("end-date")
                    if (startDateInput) startDateInput.value = ''
                    if (endDateInput) endDateInput.value = ''

                    // Remove date filter
                    this.fsss.deleteCustomParams(this.config.dateFilter.solrFilterParam)
                }

                const resetPage = await page.resetFacets()
                this.initFacetContainer(resetPage)
                this.renderAllFacets(resetPage)
                this.renderSearchResults(resetPage)
                this.updateResultsInfo(resetPage, new URLSearchParams(window.location.search).get("query"))
            }
        }
    }

    /**
     * Render all facets
     */
    renderAllFacets(page) {
        if (!page.facets || page.facets.length === 0) return

        // Setup date filter
        if (this.config.dateFilter.enabled) {
            this._setupDateFilter(page)
        }

        // Render each facet
        page.facets.forEach((facet) => {
            const displayName = this.config.facets.displayNames[facet.name]
            if (displayName) {
                const facetToRender = facet.setDisplayName(displayName)
                this.renderFacet(facetToRender)
            } else {
                this.renderFacet(facet)
            }
        })
    }

    /**
     * Setup date filter inputs
     */
    _setupDateFilter(page) {
        const dateFilterBox = document.getElementById("custom-date-filter")
        if (!dateFilterBox) return

        dateFilterBox.style.display = ""

        let startDateInput = document.getElementById("start-date")
        let endDateInput = document.getElementById("end-date")
        const resetDateBtn = document.getElementById("reset-date-filter")

        if (startDateInput && endDateInput) {
            // Remove existing listeners
            startDateInput.replaceWith(startDateInput.cloneNode(true))
            endDateInput.replaceWith(endDateInput.cloneNode(true))

            // Get fresh references
            startDateInput = document.getElementById("start-date")
            endDateInput = document.getElementById("end-date")

            // Add change listeners
            startDateInput.addEventListener("change", () => {
                if (page.facets && page.facets.length > 0) {
                    this.filter(page.facets[0])
                }
            })

            endDateInput.addEventListener("change", () => {
                if (page.facets && page.facets.length > 0) {
                    this.filter(page.facets[0])
                }
            })

            // Reset button
            if (resetDateBtn) {
                resetDateBtn.onclick = async () => {
                    startDateInput.value = ''
                    endDateInput.value = ''
                    this.fsss.deleteCustomParams(this.config.dateFilter.solrFilterParam)

                    if (page.facets && page.facets.length > 0) {
                        this.filter(page.facets[0])
                    }
                }
            }
        }
    }

    /**
     * Render a single facet
     */
    renderFacet(facet) {
        if (!this.facetContainer) return

        // Check if theme provides custom rendering
        if (this.currentTheme?.components?.renderFacet) {
            const html = this.currentTheme.components.renderFacet(facet, this)
            const facetElement = this._htmlToElement(html)

            // Attach theme's event handlers if provided
            if (this.currentTheme.eventHandlers?.attachFacetListeners) {
                this.currentTheme.eventHandlers.attachFacetListeners(facetElement, facet, this)
            }

            this.facetContainer.appendChild(facetElement)
            return
        }

        // Default rendering (fallback)
        this._renderFacetDefault(facet)
    }

    /**
     * Default facet rendering (used when no theme override)
     */
    _renderFacetDefault(facet) {
        if (!this.facetContainer) return

        const facetGroup = document.createElement("div")
        facetGroup.classList.add("facet-group")

        // Title with reset button
        const titleContainer = document.createElement("div")
        titleContainer.classList.add("filter-group-title")

        const title = document.createElement("span")
        title.innerText = facet.displayName || facet.name
        titleContainer.appendChild(title)

        const resetBtn = document.createElement("button")
        resetBtn.classList.add("facet-reset-btn")
        resetBtn.innerText = "Reset"
        resetBtn.onclick = () => this.filter(facet, true)
        titleContainer.appendChild(resetBtn)

        facetGroup.appendChild(titleContainer)

        // Options container
        const optionsContainer = document.createElement("div")
        optionsContainer.classList.add("facet-options")

        // Add each option
        facet.counts.forEach(count => {
            const option = document.createElement("div")
            option.classList.add("facet-option")

            const checkbox = document.createElement("input")
            checkbox.type = "checkbox"
            checkbox.name = count.value
            checkbox.id = `facet-${facet.name}-${count.value}`
            checkbox.addEventListener("input", () => this.filter(facet))

            if (facet.selectedValues && facet.selectedValues.includes(count.value)) {
                checkbox.checked = true
            }

            const label = document.createElement("label")
            label.htmlFor = checkbox.id
            label.innerHTML = `
                <span>${count.value}</span>
                <span class="facet-count">(${count.count})</span>
            `

            option.appendChild(checkbox)
            option.appendChild(label)
            optionsContainer.appendChild(option)
        })

        facetGroup.appendChild(optionsContainer)
        this.facetContainer.appendChild(facetGroup)
    }

    /**
     * Filter by facets and date
     */
    async filter(facet, reset = false) {
        let values = Array.from(document.querySelectorAll('.facet-option input[type="checkbox"]'))
            .filter(element => element.checked)
            .map(element => element.name)

        try {
            if (reset) {
                values = []
            }

            // Handle date filter
            if (this.config.dateFilter.enabled) {
                const startDateValue = document.getElementById("start-date")?.value
                const endDateValue = document.getElementById("end-date")?.value

                if (startDateValue || endDateValue) {
                    const startISO = startDateValue ? new Date(startDateValue + 'T00:00:00Z').toISOString() : '*'
                    const endISO = endDateValue ? new Date(endDateValue + 'T23:59:59Z').toISOString() : '*'
                    const dateFilterQuery = `${this.config.dateFilter.fieldName}:[${startISO} TO ${endISO}]`

                    this.fsss.setCustomParams({ [this.config.dateFilter.solrFilterParam]: dateFilterQuery })
                } else {
                    this.fsss.deleteCustomParams(this.config.dateFilter.solrFilterParam)
                }
            }

            let page = await facet.filter(...values)

            this.initFacetContainer(page)
            this.renderAllFacets(page)
            this.renderSearchResults(page)
            this.updateResultsInfo(page, new URLSearchParams(window.location.search).get("query"))

            if (this.config.features.smoothScrolling) {
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        } catch (error) {
            console.error('Filter error:', error)
        }
    }

    /**
     * Render search results
     */
    renderSearchResults(page) {
        const paginationWrapper = document.getElementById("pagination")
        const searchResultWrapper = document.getElementById("search-results")

        if (!paginationWrapper || !searchResultWrapper) return

        // Before render hook
        if (this.config.hooks.beforeRender) {
            page = this.config.hooks.beforeRender(page)
        }

        paginationWrapper.innerHTML = ""
        searchResultWrapper.innerHTML = ""

        const hasResults = page.searchResults && page.searchResults.length > 0
        const totalResults = (page.responseData && page.responseData.numRows) ||
                             page.numRows || page.totalHits || page.totalResults || page.total || 0

        if (!hasResults || totalResults === 0) {
            searchResultWrapper.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">No results found</div>
                    <p style="margin-top: 1rem; color: var(--text-tertiary); font-size: 0.95rem;">
                        Try different keywords or remove some filters
                    </p>
                </div>
            `
            return
        }

        // Use custom template if provided
        if (this.config.resultTemplate) {
            this._renderWithCustomTemplate(page, searchResultWrapper)
        } else {
            this._renderDefaultCards(page, searchResultWrapper)
        }

        // Render pagination
        const pageRenderer = this.fsss.getPageRenderer(page)
        pageRenderer.renderPaginationToHTMLElement(paginationWrapper, this.config.ui.maxPaginationButtons)
        this.linkPagination(page)

        // Handle "Did You Mean"
        if (this.config.features.didYouMean) {
            this.handleDidYouMean(page, pageRenderer)
        }

        // After render hook
        if (this.config.hooks.afterRender) {
            this.config.hooks.afterRender(page)
        }
    }

    /**
     * Render results with custom template
     */
    _renderWithCustomTemplate(page, container) {
        const results = page.searchResults || []

        results.forEach((resultWrapper, index) => {
            const result = resultWrapper.result
            const highlights = resultWrapper.highlights

            const html = this.config.resultTemplate(result, highlights, this)

            const article = document.createElement('article')
            article.className = 'result-card'
            article.innerHTML = html

            container.appendChild(article)
        })
    }

    /**
     * Render default result cards
     */
    _renderDefaultCards(page, container) {
        const results = page.searchResults || []

        results.forEach((resultWrapper, index) => {
            const result = resultWrapper.result
            const highlights = resultWrapper.highlights

            // Check if theme provides custom rendering
            if (this.currentTheme?.components?.renderResultCard) {
                const html = this.currentTheme.components.renderResultCard(result, highlights, this)
                const cardElement = this._htmlToElement(html)
                cardElement.className = cardElement.className || 'result-card'

                // Attach theme's event handlers if provided
                if (this.currentTheme.eventHandlers?.attachCardListeners) {
                    this.currentTheme.eventHandlers.attachCardListeners(cardElement, result, this)
                }

                container.appendChild(cardElement)
                return
            }

            // Default rendering (fallback)
            const resultCard = document.createElement('article')
            resultCard.className = 'result-card'

            // Extract fields using config
            const title = this.getField(result, 'title')
            const link = this.getField(result, 'link')
            const date = this.formatDate(result)

            // Get description with highlighting
            let description = this.config.resultFields.description.fallback
            if (this.config.resultFields.description.useHighlighting &&
                highlights && highlights.content && highlights.content[0]) {
                description = highlights.content[0]
            } else {
                description = this.getField(result, 'description')
            }

            const language = this.getField(result, 'language') ||
                           this.config.resultFields.language.default

            // Build card HTML
            resultCard.innerHTML = `
                ${this.config.features.fieldInspector ? `
                <button class="result-menu-btn" data-result-index="${index}" aria-label="Show all fields" title="Show all fields">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
                ` : ''}
                <a href="${link}" target="_blank" rel="noopener noreferrer" class="result-link">
                    <div class="result-header">
                        <h2 class="result-title">${title}</h2>
                    </div>
                    <div class="result-content">
                        <p class="result-description">${description}</p>
                    </div>
                    <div class="result-footer">
                        <div class="result-meta-row">
                            <span class="result-date">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                ${date}
                            </span>
                            <span class="result-badge">${language}</span>
                        </div>
                        <div class="result-url">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                            <span class="url-text" title="${link}">${link.length > 80 ? link.substring(0, 80) + '...' : link}</span>
                        </div>
                    </div>
                </a>
            `

            // Add field inspector button handler
            if (this.config.features.fieldInspector) {
                const menuBtn = resultCard.querySelector('.result-menu-btn')
                if (menuBtn) {
                    menuBtn.addEventListener('click', (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        this.openFieldsSidebar(result)
                    })
                }
            }

            // Track result clicks
            if (this.config.hooks.onResultClick) {
                const link = resultCard.querySelector('.result-link')
                if (link) {
                    link.addEventListener('click', () => {
                        this.config.hooks.onResultClick(result)
                    })
                }
            }

            container.appendChild(resultCard)
        })
    }

    /**
     * Handle Did You Mean suggestions
     */
    handleDidYouMean(page, pageRenderer) {
        const element = document.getElementById("did-you-mean")
        if (!element) return

        if (page.didYouMean && page.didYouMean.length > 0) {
            pageRenderer.renderDidYouMeanToHTMLElement(element)
            element.style.display = "block"
        } else {
            element.style.display = "none"
        }
    }

    /**
     * Update results info display
     */
    updateResultsInfo(page, query) {
        const resultsInfo = document.getElementById("results-info")
        if (!resultsInfo || !query) return

        const totalResults = (page.responseData && page.responseData.numRows) ||
                             page.numRows || page.totalHits || page.totalResults || page.total || 0

        const currentPage = (page.paginationParams && page.paginationParams.page) ||
                            page.pageNumber || page.currentPage || page.page || 1

        const pageSize = (page.responseData && page.responseData.rows) ||
                         page.rows || page.pageSize || page.size || 10

        if (totalResults > 0) {
            const startResult = ((currentPage - 1) * pageSize) + 1
            const endResult = Math.min(currentPage * pageSize, totalResults)
            resultsInfo.innerHTML = `Showing <strong>${startResult}-${endResult}</strong> of <strong>${totalResults}</strong> results for "<strong>${query}</strong>"`
        } else {
            resultsInfo.innerHTML = ''
        }
    }

    /**
     * Link pagination buttons
     */
    async linkPagination(searchResultPage) {
        const pagination = document.getElementsByClassName("smart-search-pagination")[0]
        if (!pagination) return

        const paginationButtons = pagination.children

        for (let button of paginationButtons) {
            button.addEventListener("click", async (event) => {
                const clickedButton = event.currentTarget
                const pageNumber = Number(clickedButton.getAttribute("smart-search-page-value") || "0")
                const page = await searchResultPage.getPage(pageNumber)

                this.renderSearchResults(page)
                this.updateResultsInfo(page, new URLSearchParams(window.location.search).get("query"))

                if (this.config.features.smoothScrolling) {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                }
            })
        }
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        const searchResults = document.getElementById("search-results")
        if (searchResults) {
            searchResults.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${this.config.ui.emptyStateIcon}</div>
                    <div class="empty-state-text">${this.config.ui.emptyStateMessage}</div>
                </div>
            `
        }

        const resultsInfo = document.getElementById("results-info")
        if (resultsInfo) {
            resultsInfo.innerHTML = ''
        }
    }

    /**
     * Show error state
     */
    showErrorState(error) {
        const searchResults = document.getElementById("search-results")
        if (searchResults) {
            searchResults.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${this.config.ui.errorStateIcon}</div>
                    <div class="empty-state-text">An error occurred while searching</div>
                    <p style="margin-top: 1rem; color: var(--text-tertiary); font-size: 0.875rem;">${error.message || 'Please try again later'}</p>
                </div>
            `
        }
    }

    /**
     * Open field inspector sidebar
     */
    openFieldsSidebar(result) {
        // Remove existing sidebar
        const existingSidebar = document.getElementById('fields-sidebar')
        if (existingSidebar) {
            existingSidebar.remove()
        }

        // Create backdrop
        const backdrop = document.createElement('div')
        backdrop.id = 'fields-sidebar-backdrop'
        backdrop.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 99998; opacity: 0; transition: opacity 0.3s ease;'

        // Create sidebar
        const sidebar = document.createElement('div')
        sidebar.id = 'fields-sidebar'
        sidebar.style.cssText = 'position: fixed; top: 0; right: -500px; width: 500px; max-width: 90vw; height: 100vh; background: white; z-index: 99999; box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15); transition: right 0.3s ease; display: flex; flex-direction: column;'

        // Build sidebar content
        sidebar.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                <h3 style="font-size: 1.125rem; font-weight: 600; color: #1f2937; margin: 0;">All Fields</h3>
                <button id="close-sidebar" style="background: none; border: none; font-size: 1.5rem; color: #6b7280; cursor: pointer; width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; border-radius: 0.375rem; transition: background 0.15s;" aria-label="Close">×</button>
            </div>
            <div style="flex: 1; overflow-y: auto; padding: 1.5rem;">
                ${Object.entries(result).map(([key, value]) => {
                    let displayValue = value;
                    if (Array.isArray(value)) {
                        displayValue = value.join(', ');
                    } else if (typeof value === 'object' && value !== null) {
                        displayValue = JSON.stringify(value, null, 2);
                    }
                    return `
                        <div style="margin-bottom: 1.5rem;">
                            <div style="font-weight: 600; color: #6b7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.025em; margin-bottom: 0.5rem;">${key}</div>
                            <div style="color: #1f2937; font-family: 'Courier New', monospace; font-size: 0.8125rem; line-height: 1.6; padding: 0.75rem; background: #f9fafb; border-radius: 0.5rem; border-left: 3px solid #2563eb; word-break: break-all;">${displayValue || 'N/A'}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `

        document.body.appendChild(backdrop)
        document.body.appendChild(sidebar)

        // Animate in
        setTimeout(() => {
            backdrop.style.opacity = '1'
            sidebar.style.right = '0'
        }, 10)

        // Close handlers
        const closeSidebar = () => {
            backdrop.style.opacity = '0'
            sidebar.style.right = '-500px'
            setTimeout(() => {
                backdrop.remove()
                sidebar.remove()
            }, 300)
        }

        document.getElementById('close-sidebar').addEventListener('click', closeSidebar)
        backdrop.addEventListener('click', closeSidebar)
    }

    /**
     * Initialize settings button
     */
    _initSettingsButton() {
        // Will be initialized after DOM loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._setupSettingsButton())
        } else {
            this._setupSettingsButton()
        }
    }

    _setupSettingsButton() {
        const settingsBtn = document.getElementById('settings-btn')
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettingsModal())
        }
    }

    /**
     * Open settings modal
     */
    openSettingsModal() {
        const config = this.config.server
        const currentServer = localStorage.getItem(config.localStorageKeys.server) || config.defaultURL
        const currentPreparedSearch = localStorage.getItem(config.localStorageKeys.preparedSearch) || config.defaultPreparedSearch

        // Get current theme
        const currentThemeId = this.currentThemeId || this.config.theme?.default || 'default'
        const availableThemes = this.config.theme?.available || []

        // Create backdrop
        const backdrop = document.createElement('div')
        backdrop.id = 'settings-backdrop'
        backdrop.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 100000; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease;'

        // Create modal
        const modal = document.createElement('div')
        modal.id = 'settings-modal'
        modal.style.cssText = 'background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); width: 600px; max-width: 90vw; max-height: 90vh; overflow: hidden; transform: scale(0.9); transition: transform 0.3s ease;'

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                <h3 style="font-size: 1.25rem; font-weight: 600; color: #1f2937; margin: 0;">Settings</h3>
                <button id="close-settings-modal" style="background: none; border: none; font-size: 1.5rem; color: #6b7280; cursor: pointer; width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; border-radius: 0.375rem; transition: background 0.15s;" aria-label="Close">×</button>
            </div>
            <div style="padding: 2rem;">
                <form id="settings-form">
                    ${availableThemes.length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <label for="theme-select" style="display: block; font-weight: 600; color: #374151; font-size: 0.875rem; margin-bottom: 0.5rem;">
                            Theme
                        </label>
                        <select
                            id="theme-select"
                            style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; transition: border-color 0.15s; background: white;">
                            ${availableThemes.map(theme => `
                                <option value="${theme.id}" ${theme.id === currentThemeId ? 'selected' : ''}>
                                    ${theme.name} - ${theme.description}
                                </option>
                            `).join('')}
                        </select>
                        <p style="margin-top: 0.5rem; font-size: 0.75rem; color: #6b7280;">Changes apply instantly</p>
                    </div>
                    ` : ''}

                    <div style="margin-bottom: 1.5rem;">
                        <label for="server-url" style="display: block; font-weight: 600; color: #374151; font-size: 0.875rem; margin-bottom: 0.5rem;">
                            Server URL
                        </label>
                        <input
                            type="text"
                            id="server-url"
                            value="${currentServer}"
                            placeholder="${config.defaultURL}"
                            style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; font-family: 'Courier New', monospace; transition: border-color 0.15s;"
                        />
                        <p style="margin-top: 0.5rem; font-size: 0.75rem; color: #6b7280;">Default: ${config.defaultURL}</p>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <label for="prepared-search" style="display: block; font-weight: 600; color: #374151; font-size: 0.875rem; margin-bottom: 0.5rem;">
                            Prepared Search
                        </label>
                        <input
                            type="text"
                            id="prepared-search"
                            value="${currentPreparedSearch}"
                            placeholder="${config.defaultPreparedSearch}"
                            style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; transition: border-color 0.15s;"
                        />
                        <p style="margin-top: 0.5rem; font-size: 0.75rem; color: #6b7280;">Default: ${config.defaultPreparedSearch}</p>
                    </div>

                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button
                            type="button"
                            id="reset-settings"
                            style="padding: 0.75rem 1.5rem; background: #f3f4f6; color: #374151; border: none; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: background 0.15s;"
                        >
                            Reset to Default
                        </button>
                        <button
                            type="button"
                            id="cancel-settings"
                            style="padding: 0.75rem 1.5rem; background: #f3f4f6; color: #374151; border: none; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: background 0.15s;"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #2563eb, #8b5cf6); color: white; border: none; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: transform 0.15s;"
                        >
                            Save & Reload
                        </button>
                    </div>
                </form>
            </div>
        `

        backdrop.appendChild(modal)
        document.body.appendChild(backdrop)

        // Animate in
        setTimeout(() => {
            backdrop.style.opacity = '1'
            modal.style.transform = 'scale(1)'
        }, 10)

        // Close handlers
        const closeModal = () => {
            backdrop.style.opacity = '0'
            modal.style.transform = 'scale(0.9)'
            setTimeout(() => backdrop.remove(), 300)
        }

        document.getElementById('close-settings-modal').addEventListener('click', closeModal)
        document.getElementById('cancel-settings').addEventListener('click', closeModal)
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal()
        })

        // Reset to default
        document.getElementById('reset-settings').addEventListener('click', () => {
            document.getElementById('server-url').value = config.defaultURL
            document.getElementById('prepared-search').value = config.defaultPreparedSearch
        })

        // Save settings
        document.getElementById('settings-form').addEventListener('submit', (e) => {
            e.preventDefault()

            const newServer = document.getElementById('server-url').value.trim() || config.defaultURL
            const newPreparedSearch = document.getElementById('prepared-search').value.trim() || config.defaultPreparedSearch

            localStorage.setItem(config.localStorageKeys.server, newServer)
            localStorage.setItem(config.localStorageKeys.preparedSearch, newPreparedSearch)

            window.location.reload()
        })

        // Add theme selector change listener (instant preview)
        const themeSelect = modal.querySelector('#theme-select')
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                const newThemeId = e.target.value
                this.switchTheme(newThemeId)
            })
        }

        // Add focus/hover styles
        const inputs = modal.querySelectorAll('input')
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.style.borderColor = '#2563eb'
                input.style.outline = 'none'
            })
            input.addEventListener('blur', () => {
                input.style.borderColor = '#d1d5db'
            })
        })

        const buttons = modal.querySelectorAll('button[type="button"], button[type="submit"]')
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                if (button.type === 'submit') {
                    button.style.transform = 'scale(1.02)'
                } else {
                    button.style.background = '#e5e7eb'
                }
            })
            button.addEventListener('mouseleave', () => {
                if (button.type === 'submit') {
                    button.style.transform = 'scale(1)'
                } else {
                    button.style.background = '#f3f4f6'
                }
            })
        })
    }
}

// Form submission handler
function submitSearchForm(event) {
    event.preventDefault()
    const searchbar = document.getElementById("search-bar")
    if (searchbar && searchbar.value) {
        document.getElementById("search-form").submit()
    }
}
