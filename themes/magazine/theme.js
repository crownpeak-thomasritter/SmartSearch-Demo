/**
 * Magazine Theme Module
 *
 * Editorial-inspired design with top filter bar and grid layout
 *
 * Theme Characteristics:
 * - Horizontal filter bar at the top (not sidebar)
 * - 2-column grid layout for results
 * - Large, visual result cards
 * - Serif + sans-serif typography mix
 * - Editorial color palette
 * - Featured result styling
 * - Magazine/publisher aesthetic
 */

window.SmartSearchThemes = window.SmartSearchThemes || {};

window.SmartSearchThemes.magazine = {
    name: 'Magazine',
    description: 'Editorial design with top filters and visual grid',
    cssFile: 'themes/magazine/theme.css',

    /**
     * Component overrides
     */
    components: {
        /**
         * Render facet as horizontal tag bar
         */
        renderFacet(facet, uiInstance) {
            const selectedValues = facet.selectedValues || [];

            return `
                <div class="magazine-facet" data-facet-name="${facet.name}">
                    <div class="magazine-facet-header">
                        <h3 class="magazine-facet-label">${facet.displayName || facet.name}</h3>
                        ${facet.selectedValues && facet.selectedValues.length > 0 ? `
                            <button class="magazine-facet-clear" data-facet-name="${facet.name}">
                                Clear
                            </button>
                        ` : ''}
                    </div>
                    <div class="magazine-tags-row">
                        ${facet.counts.map(count => `
                            <button
                                class="magazine-tag ${selectedValues.includes(count.value) ? 'magazine-tag-selected' : ''}"
                                data-facet="${facet.name}"
                                data-value="${count.value}">
                                ${count.value}
                                <span class="magazine-tag-count">${count.count}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        },

        /**
         * Render result card in editorial style
         */
        renderResultCard(result, highlights, uiInstance) {
            const title = uiInstance.getField(result, 'title');
            const link = uiInstance.getField(result, 'link');
            const date = uiInstance.formatDate(result);

            let description = uiInstance.config.resultFields.description.fallback;
            if (uiInstance.config.resultFields.description.useHighlighting &&
                highlights && highlights.content && highlights.content[0]) {
                description = highlights.content[0];
            } else {
                description = uiInstance.getField(result, 'description');
            }

            const language = uiInstance.getField(result, 'language') ||
                           uiInstance.config.resultFields.language.default;

            // Get first letter for decorative initial and rest of title
            const safeTitle = title || 'Untitled';
            const firstLetter = safeTitle.charAt(0).toUpperCase();
            const restOfTitle = safeTitle.length > 1 ? safeTitle.substring(1) : '';

            return `
                <a href="${link}" target="_blank" rel="noopener noreferrer" class="magazine-result-link">
                    <article class="magazine-result-card">
                        <div class="magazine-card-accent"></div>
                        <div class="magazine-card-content">
                            <div class="magazine-card-meta">
                                <time class="magazine-meta-date">${date}</time>
                                <span class="magazine-meta-separator">•</span>
                                <span class="magazine-meta-language">${language}</span>
                            </div>
                            <h2 class="magazine-card-title">
                                <span class="magazine-drop-cap">${firstLetter}</span>${restOfTitle}
                            </h2>
                            <p class="magazine-card-excerpt">${description}</p>
                            <div class="magazine-card-footer">
                                <span class="magazine-read-more">
                                    Continue reading
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </article>
                </a>
            `;
        }
    },

    /**
     * Event handlers
     */
    eventHandlers: {
        /**
         * Attach listeners to horizontal tag filters
         */
        attachFacetListeners(facetElement, facet, uiInstance) {
            const tags = facetElement.querySelectorAll('.magazine-tag');
            const clearBtn = facetElement.querySelector('.magazine-facet-clear');

            tags.forEach(tag => {
                tag.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    tag.classList.toggle('magazine-tag-selected');

                    const allSelectedTags = document.querySelectorAll('.magazine-tag-selected');
                    const selectedValues = Array.from(allSelectedTags).map(t => t.dataset.value);

                    if (uiInstance.config.dateFilter.enabled) {
                        const startDateValue = document.getElementById("start-date")?.value;
                        const endDateValue = document.getElementById("end-date")?.value;

                        if (startDateValue || endDateValue) {
                            const startISO = startDateValue ? new Date(startDateValue + 'T00:00:00Z').toISOString() : '*';
                            const endISO = endDateValue ? new Date(endDateValue + 'T23:59:59Z').toISOString() : '*';
                            const dateFilterQuery = `${uiInstance.config.dateFilter.fieldName}:[${startISO} TO ${endISO}]`;

                            uiInstance.fsss.setCustomParams({ [uiInstance.config.dateFilter.solrFilterParam]: dateFilterQuery });
                        } else {
                            uiInstance.fsss.deleteCustomParams(uiInstance.config.dateFilter.solrFilterParam);
                        }
                    }

                    try {
                        let page = await facet.filter(...selectedValues);

                        uiInstance.initFacetContainer(page);
                        uiInstance.renderAllFacets(page);
                        uiInstance.renderSearchResults(page);
                        uiInstance.updateResultsInfo(page, new URLSearchParams(window.location.search).get("query"));

                        if (uiInstance.config.features.smoothScrolling) {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    } catch (error) {
                        console.error('Filter error:', error);
                    }
                });
            });

            if (clearBtn) {
                clearBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    tags.forEach(tag => tag.classList.remove('magazine-tag-selected'));
                    await uiInstance.filter(facet, true);
                });
            }
        },

        /**
         * Attach listeners to result cards
         */
        attachCardListeners(cardElement, result, uiInstance) {
            if (uiInstance.config.hooks.onResultClick) {
                cardElement.addEventListener('click', () => {
                    uiInstance.config.hooks.onResultClick(result);
                });
            }
        }
    },

    /**
     * Initialize theme
     */
    init(uiInstance) {
        console.log('[Magazine] Theme initialized');

        // Restructure layout: move filters to top
        if (document.body) {
            // Wait for DOM to be ready
            const restructure = () => {
                console.log('[Magazine] Restructuring layout...');
                const contentGrid = document.querySelector('.content-grid');
                const sidebar = document.querySelector('.sidebar');
                const resultsSection = document.querySelector('.results-section');

                console.log('[Magazine] Found elements:', {
                    contentGrid: !!contentGrid,
                    sidebar: !!sidebar,
                    resultsSection: !!resultsSection
                });

                if (contentGrid && sidebar && resultsSection) {
                    // Add magazine class to content grid
                    contentGrid.classList.add('magazine-layout');

                    // Create horizontal filter bar and move the entire sidebar container
                    const filtersContainer = sidebar.querySelector('.filters-container');
                    console.log('[Magazine] filtersContainer found:', !!filtersContainer);

                    if (filtersContainer) {
                        // Create wrapper for horizontal layout
                        const filterBar = document.createElement('div');
                        filterBar.className = 'magazine-filter-bar';
                        filterBar.id = 'magazine-filter-wrapper';

                        // Move the actual filters container (not just innerHTML)
                        filterBar.appendChild(filtersContainer);

                        // Insert before results
                        resultsSection.parentNode.insertBefore(filterBar, resultsSection);
                        console.log('[Magazine] Filter bar inserted into DOM');

                        // Add expand/collapse button after moving filters
                        // Use longer timeout to ensure facets are rendered
                        console.log('[Magazine] Scheduling _addExpandButton in 300ms...');
                        setTimeout(() => {
                            this._addExpandButton(filterBar);
                        }, 300);
                    }

                    // Hide original sidebar
                    sidebar.style.display = 'none';

                    // Change results to 2-column grid
                    const searchResults = document.querySelector('#search-results');
                    if (searchResults) {
                        searchResults.classList.add('magazine-grid');
                    }
                } else {
                    console.log('[Magazine] Missing required elements, cannot restructure');
                }
            };

            if (document.readyState === 'loading') {
                console.log('[Magazine] Waiting for DOMContentLoaded...');
                document.addEventListener('DOMContentLoaded', restructure);
            } else {
                console.log('[Magazine] DOM already loaded, restructuring now');
                restructure();
            }
        }
    },

    /**
     * Add expand/collapse button for filters
     */
    _addExpandButton(filterBar, retryCount = 0) {
        console.log('[Magazine] _addExpandButton called, retry:', retryCount);

        const facetsContainer = filterBar.querySelector('#facets-container');
        if (!facetsContainer) {
            console.log('[Magazine] No facetsContainer found, retrying...');
            // Retry if facets container not found yet
            if (retryCount < 5) {
                setTimeout(() => this._addExpandButton(filterBar, retryCount + 1), 200);
            } else {
                console.log('[Magazine] Max retries reached, giving up on facetsContainer');
            }
            return;
        }

        console.log('[Magazine] facetsContainer found:', facetsContainer);

        // Look for both magazine-facet and facet-group (default) classes
        const facets = facetsContainer.querySelectorAll('.magazine-facet, .facet-group');

        // Also get the date filter
        const dateFilter = filterBar.querySelector('#custom-date-filter');

        console.log('[Magazine] Found', facets.length, 'facets');
        console.log('[Magazine] Date filter found:', !!dateFilter);
        facets.forEach((facet, i) => {
            console.log(`[Magazine] Facet ${i}:`, facet.className, facet);
        });

        // If no facets found yet, retry
        if (facets.length === 0 && retryCount < 5) {
            console.log('[Magazine] No facets found yet, retrying...');
            setTimeout(() => this._addExpandButton(filterBar, retryCount + 1), 200);
            return;
        }

        // Count total hideable items (facets after first + date filter if exists)
        const hideableCount = (facets.length > 1 ? facets.length - 1 : 0) + (dateFilter ? 1 : 0);

        if (hideableCount === 0) {
            console.log('[Magazine] No filters to hide, not adding expand button');
            return;
        }

        console.log('[Magazine] Hiding all facets except first and date filter...');
        // Hide all facets except the first one
        facets.forEach((facet, index) => {
            if (index > 0) {
                console.log('[Magazine] Hiding facet', index, ':', facet.className);
                facet.classList.add('magazine-facet-hidden');
            }
        });

        // Also hide the date filter by default
        if (dateFilter) {
            console.log('[Magazine] Hiding date filter');
            dateFilter.classList.add('magazine-facet-hidden');
        }

        console.log('[Magazine] Creating expand button...');
        // Create expand button
        const expandBtn = document.createElement('button');
        expandBtn.className = 'magazine-expand-filters';
        expandBtn.id = 'magazine-expand-btn';
        expandBtn.innerHTML = `
            <span class="magazine-expand-text">Show more filters (${hideableCount})</span>
            <svg class="magazine-expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `;

        // Add click handler
        expandBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isExpanded = filterBar.classList.contains('magazine-filters-expanded');

            if (isExpanded) {
                // Collapse
                filterBar.classList.remove('magazine-filters-expanded');
                expandBtn.querySelector('.magazine-expand-text').textContent = `Show more filters (${hideableCount})`;
                expandBtn.classList.remove('magazine-expanded');
                facets.forEach((facet, index) => {
                    if (index > 0) facet.classList.add('magazine-facet-hidden');
                });
                if (dateFilter) {
                    dateFilter.classList.add('magazine-facet-hidden');
                }
            } else {
                // Expand
                filterBar.classList.add('magazine-filters-expanded');
                expandBtn.querySelector('.magazine-expand-text').textContent = 'Show fewer filters';
                expandBtn.classList.add('magazine-expanded');
                facets.forEach(facet => facet.classList.remove('magazine-facet-hidden'));
                if (dateFilter) {
                    dateFilter.classList.remove('magazine-facet-hidden');
                }
            }
        });

        console.log('[Magazine] Inserting button after facetsContainer...');
        // Insert button after facets container
        facetsContainer.parentNode.insertBefore(expandBtn, facetsContainer.nextSibling);
        console.log('[Magazine] Expand button inserted successfully!');
    },

    /**
     * Cleanup theme
     */
    destroy(uiInstance) {
        console.log('[Theme] Magazine theme cleaned up');

        // Restore original layout
        const contentGrid = document.querySelector('.content-grid');
        const sidebar = document.querySelector('.sidebar');
        const filterBar = document.querySelector('#magazine-filter-wrapper');
        const searchResults = document.querySelector('#search-results');

        if (contentGrid) {
            contentGrid.classList.remove('magazine-layout');
        }

        // Move filters back to sidebar
        if (filterBar && sidebar) {
            const filtersContainer = filterBar.querySelector('.filters-container');
            if (filtersContainer) {
                sidebar.appendChild(filtersContainer);
            }
            filterBar.remove();
        }

        if (sidebar) {
            sidebar.style.display = '';
        }

        if (searchResults) {
            searchResults.classList.remove('magazine-grid');
        }
    }
};
