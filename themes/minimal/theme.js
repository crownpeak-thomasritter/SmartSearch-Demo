/**
 * Minimal Zen Theme Module
 *
 * Japanese-inspired minimalist design with elegant typography
 *
 * Theme Characteristics:
 * - Ultra-clean, monochromatic palette
 * - Generous white space (breathing room)
 * - Subtle warm accents (sage green)
 * - Elegant serif/sans-serif typography mix
 * - Tag-based facet selection
 * - Refined micro-interactions
 * - Wabi-sabi aesthetic (imperfect beauty)
 */

window.SmartSearchThemes = window.SmartSearchThemes || {};

window.SmartSearchThemes.minimal = {
    name: 'Minimal Zen',
    description: 'Japanese-inspired minimalist design with elegant typography',
    cssFile: 'themes/minimal/theme.css',

    /**
     * Component overrides
     */
    components: {
        /**
         * Render facet as selectable tag pills
         */
        renderFacet(facet, uiInstance) {
            const selectedValues = facet.selectedValues || [];

            return `
                <div class="facet-group minimal-facet" data-facet-name="${facet.name}">
                    <div class="minimal-facet-header">
                        <h3 class="minimal-facet-title">${facet.displayName || facet.name}</h3>
                        <button class="minimal-facet-clear" data-facet-name="${facet.name}" title="Clear">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="minimal-facet-tags">
                        ${facet.counts.map(count => `
                            <button
                                class="minimal-tag ${selectedValues.includes(count.value) ? 'minimal-tag-active' : ''}"
                                data-facet="${facet.name}"
                                data-value="${count.value}">
                                <span class="minimal-tag-label">${count.value}</span>
                                <span class="minimal-tag-count">${count.count}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        },

        /**
         * Render result card in minimal style
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

            return `
                <a href="${link}" target="_blank" rel="noopener noreferrer" class="result-link minimal-result">
                    <div class="minimal-result-content">
                        <div class="minimal-result-meta">
                            <time class="minimal-date">${date}</time>
                            <span class="minimal-separator">·</span>
                            <span class="minimal-language">${language}</span>
                        </div>
                        <h2 class="result-title minimal-title">${title}</h2>
                        <p class="result-description minimal-description">${description}</p>
                        <div class="minimal-link-indicator">
                            <span class="minimal-link-text">Read more</span>
                            <svg class="minimal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </div>
                    </div>
                </a>
            `;
        }
    },

    /**
     * Event handlers
     */
    eventHandlers: {
        /**
         * Attach listeners to tag-based facets
         */
        attachFacetListeners(facetElement, facet, uiInstance) {
            // Get all tag buttons
            const tags = facetElement.querySelectorAll('.minimal-tag');
            const clearBtn = facetElement.querySelector('.minimal-facet-clear');

            // Handle tag clicks
            tags.forEach(tag => {
                tag.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Toggle active state
                    tag.classList.toggle('minimal-tag-active');

                    // Get all selected values across all facets
                    const allTags = document.querySelectorAll('.minimal-tag-active');
                    const selectedValues = Array.from(allTags).map(t => t.dataset.value);

                    // Handle date filter
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

            // Handle clear button
            if (clearBtn) {
                clearBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Deselect all tags in this facet
                    tags.forEach(tag => tag.classList.remove('minimal-tag-active'));

                    // Trigger filter with empty values
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
        console.log('[Theme] Minimal Zen theme initialized');

        // Add gentle fade-in animation to elements
        if (document.body) {
            document.body.style.opacity = '0';
            setTimeout(() => {
                document.body.style.transition = 'opacity 0.6s ease';
                document.body.style.opacity = '1';
            }, 50);
        }
    },

    /**
     * Cleanup theme
     */
    destroy(uiInstance) {
        console.log('[Theme] Minimal Zen theme cleaned up');
    }
};
