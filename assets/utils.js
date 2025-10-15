/**
 * Minecraft War Riders - Utility Functions
 * Production-grade JavaScript utilities for the website
 */

// YAML Parser (Simple implementation for our use case)
class SimpleYAMLParser {
    static parse(yamlString) {
        const lines = yamlString.split('\n');
        const result = {};
        const stack = [result];
        let currentIndent = 0;
        
        for (let line of lines) {
            // Skip comments and empty lines
            if (line.trim().startsWith('#') || line.trim() === '') continue;
            
            const indent = line.search(/\S/);
            const trimmedLine = line.trim();
            
            // Handle indentation changes
            while (stack.length > 1 && indent <= currentIndent) {
                stack.pop();
                currentIndent -= 2;
            }
            
            if (trimmedLine.includes(':')) {
                const [key, value] = trimmedLine.split(':').map(s => s.trim());
                const current = stack[stack.length - 1];
                
                if (value === '' || value === null) {
                    // This is an object
                    current[key] = {};
                    stack.push(current[key]);
                    currentIndent = indent;
                } else {
                    // This is a value
                    current[key] = this.parseValue(value);
                }
            }
        }
        
        return result;
    }
    
    static parseValue(value) {
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }
        
        // Parse numbers
        if (!isNaN(value) && !isNaN(parseFloat(value))) {
            return parseFloat(value);
        }
        
        // Parse booleans
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
        
        // Parse arrays (simple implementation)
        if (value.startsWith('[') && value.endsWith(']')) {
            return value.slice(1, -1).split(',').map(v => this.parseValue(v.trim()));
        }
        
        return value;
    }
}

// Item Data Loader
class ItemDataLoader {
    constructor() {
        this.cache = new Map();
        this.categories = [
            'Automation', 'Blocks', 'Decoration', 'Dyes', 'Enchanting', 
            'Farming', 'Food', 'Miscellaneous', 'Mobs', 'Music', 
            'Ores', 'Potions', 'Redstone', 'SpawnEggs', 'Spawners', 
            'Workstations', 'Z_EverythingElse'
        ];
        this.itemIcons = new Map([
            // Common Minecraft items with emoji representations
            ['CHEST', '📦'], ['DIAMOND', '💎'], ['IRON_INGOT', '🔸'],
            ['GOLD_INGOT', '🟨'], ['EMERALD', '💚'], ['BREAD', '🍞'],
            ['APPLE', '🍎'], ['STONE', '🪨'], ['OAK_LOG', '🪵'],
            ['WHEAT', '🌾'], ['CARROT', '🥕'], ['POTATO', '🥔'],
            ['BEEF', '🥩'], ['PORKCHOP', '🥓'], ['CHICKEN', '🍗'],
            ['IRON_PICKAXE', '⛏️'], ['IRON_SWORD', '⚔️'], ['IRON_AXE', '🪓'],
            ['BOW', '🏹'], ['ARROW', '➡️'], ['COAL', '⚫'],
            ['REDSTONE', '🔴'], ['LAPIS_LAZULI', '🔵'], ['GLOWSTONE_DUST', '✨'],
            // Decoration items
            ['CHAIN', '⛓️'], ['FLOWER_POT', '🪴'], ['ITEM_FRAME', '🖼️'],
            ['PAINTING', '🎨'], ['ARMOR_STAND', '🚶'], ['BANNER', '🏴'],
            // Food items
            ['COOKED_BEEF', '🍖'], ['COOKED_CHICKEN', '🍗'], ['COOKED_SALMON', '🍣'],
            ['COOKIE', '🍪'], ['CAKE', '🎂'], ['PUMPKIN_PIE', '🥧'],
            // Blocks
            ['COBBLESTONE', '🪨'], ['DIRT', '🟫'], ['GRASS_BLOCK', '🟩'],
            ['SAND', '🟨'], ['GRAVEL', '⚫'], ['WOOD_PLANKS', '🟫'],
            // Ores
            ['COAL_ORE', '⚫'], ['IRON_ORE', '🔸'], ['GOLD_ORE', '🟨'],
            ['DIAMOND_ORE', '💎'], ['EMERALD_ORE', '💚'], ['REDSTONE_ORE', '🔴']
        ]);
    }

    async loadAllItems() {
        try {
            const allItems = [];
            
            for (const category of this.categories) {
                const items = await this.loadCategory(category);
                allItems.push(...items);
            }
            
            return allItems.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Error loading items:', error);
            return this.getFallbackItems();
        }
    }

    async loadCategory(category) {
        if (this.cache.has(category)) {
            return this.cache.get(category);
        }

        try {
            const response = await fetch(`pages/sections/${category}.yml`);
            if (!response.ok) {
                throw new Error(`Failed to load ${category}: ${response.status}`);
            }
            
            const yamlText = await response.text();
            const data = SimpleYAMLParser.parse(yamlText);
            const items = this.processYAMLData(data, category.toLowerCase());
            
            this.cache.set(category, items);
            return items;
        } catch (error) {
            console.warn(`Could not load category ${category}:`, error);
            return [];
        }
    }

    processYAMLData(data, category) {
        const items = [];
        
        if (data.pages) {
            for (const pageKey in data.pages) {
                const page = data.pages[pageKey];
                if (page.items) {
                    for (const itemKey in page.items) {
                        const item = page.items[itemKey];
                        if (item.material) {
                            items.push({
                                material: item.material,
                                name: this.formatItemName(item.name || item.material),
                                category: category,
                                buy: item.buy || -1,
                                sell: item.sell || -1,
                                special: item.autosell === true || item.lore !== undefined,
                                icon: this.getItemIcon(item.material),
                                lore: item.lore,
                                customName: item.name
                            });
                        }
                    }
                }
            }
        }
        
        return items;
    }

    formatItemName(name) {
        if (typeof name === 'string' && name.includes('§')) {
            // Remove Minecraft color codes
            return name.replace(/§[0-9a-fk-or]/g, '').trim();
        }
        
        // Convert UPPER_CASE_WITH_UNDERSCORES to Title Case
        return name.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    getItemIcon(material) {
        return this.itemIcons.get(material) || '📦';
    }

    getFallbackItems() {
        // Fallback data in case YAML files can't be loaded
        return [
            {
                material: 'CHEST',
                name: 'AutoSell Chest',
                category: 'automation',
                buy: 10000,
                sell: -1,
                special: true,
                icon: '📦'
            },
            {
                material: 'DIAMOND',
                name: 'Diamond',
                category: 'ores',
                buy: 100,
                sell: 25,
                special: false,
                icon: '💎'
            },
            {
                material: 'BREAD',
                name: 'Bread',
                category: 'food',
                buy: 15.75,
                sell: 3.94,
                special: false,
                icon: '🍞'
            }
        ];
    }
}

// Animation Utilities
class AnimationUtils {
    static observeElements(selector, className = 'visible') {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(className);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        document.querySelectorAll(selector).forEach(el => {
            observer.observe(el);
        });

        return observer;
    }

    static createParticles(container, count = 50) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
            container.appendChild(particle);
        }
    }

    static smoothScrollTo(element, offset = 0) {
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Search and Filter Utilities
class SearchUtils {
    static createSearchIndex(items) {
        const index = new Map();
        
        items.forEach((item, idx) => {
            const searchTerms = [
                item.name.toLowerCase(),
                item.material.toLowerCase(),
                item.category.toLowerCase()
            ];
            
            if (item.customName) {
                searchTerms.push(item.customName.toLowerCase());
            }
            
            searchTerms.forEach(term => {
                if (!index.has(term)) {
                    index.set(term, []);
                }
                index.get(term).push(idx);
            });
        });
        
        return index;
    }

    static searchItems(items, query, index = null) {
        if (!query.trim()) return items;
        
        const searchTerm = query.toLowerCase().trim();
        
        if (index) {
            // Use search index for better performance
            const matchingIndices = new Set();
            
            for (const [term, indices] of index.entries()) {
                if (term.includes(searchTerm)) {
                    indices.forEach(idx => matchingIndices.add(idx));
                }
            }
            
            return Array.from(matchingIndices).map(idx => items[idx]);
        } else {
            // Fallback to simple search
            return items.filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                item.material.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm)
            );
        }
    }

    static sortItems(items, sortBy) {
        const sorted = [...items];
        
        switch (sortBy) {
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'buy-high':
                return sorted.sort((a, b) => {
                    const aPrice = a.buy === -1 ? -Infinity : a.buy;
                    const bPrice = b.buy === -1 ? -Infinity : b.buy;
                    return bPrice - aPrice;
                });
            case 'buy-low':
                return sorted.sort((a, b) => {
                    const aPrice = a.buy === -1 ? Infinity : a.buy;
                    const bPrice = b.buy === -1 ? Infinity : b.buy;
                    return aPrice - bPrice;
                });
            case 'sell-high':
                return sorted.sort((a, b) => {
                    const aPrice = a.sell === -1 ? -Infinity : a.sell;
                    const bPrice = b.sell === -1 ? -Infinity : b.sell;
                    return bPrice - aPrice;
                });
            case 'sell-low':
                return sorted.sort((a, b) => {
                    const aPrice = a.sell === -1 ? Infinity : a.sell;
                    const bPrice = b.sell === -1 ? Infinity : b.sell;
                    return aPrice - bPrice;
                });
            case 'category':
                return sorted.sort((a, b) => {
                    const categorySort = a.category.localeCompare(b.category);
                    if (categorySort === 0) {
                        return a.name.localeCompare(b.name);
                    }
                    return categorySort;
                });
            default:
                return sorted;
        }
    }

    static filterItems(items, filters) {
        let filtered = items;
        
        if (filters.category && filters.category !== '') {
            filtered = filtered.filter(item => item.category === filters.category);
        }
        
        if (filters.priceRange) {
            const { min, max, type } = filters.priceRange;
            filtered = filtered.filter(item => {
                const price = type === 'buy' ? item.buy : item.sell;
                if (price === -1) return false;
                return price >= min && price <= max;
            });
        }
        
        if (filters.specialOnly) {
            filtered = filtered.filter(item => item.special);
        }
        
        return filtered;
    }
}

// Local Storage Utilities
class StorageUtils {
    static setItem(key, value) {
        try {
            localStorage.setItem(`warRiders_${key}`, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
            return false;
        }
    }

    static getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`warRiders_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }

    static removeItem(key) {
        try {
            localStorage.removeItem(`warRiders_${key}`);
            return true;
        } catch (error) {
            console.warn('Failed to remove from localStorage:', error);
            return false;
        }
    }

    static clear() {
        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith('warRiders_'));
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
            return false;
        }
    }
}

// Toast Notifications
class ToastManager {
    constructor() {
        this.container = this.createContainer();
        this.toasts = [];
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: var(--space-4);
            right: var(--space-4);
            z-index: var(--z-toast);
            pointer-events: none;
        `;
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-lg);
            padding: var(--space-4);
            margin-bottom: var(--space-2);
            max-width: 400px;
            animation: slideInRight var(--transition-base) ease-out;
            pointer-events: auto;
            cursor: pointer;
        `;
        
        const colors = {
            success: 'var(--success-500)',
            warning: 'var(--warning-500)',
            error: 'var(--error-500)',
            info: 'var(--accent-500)'
        };
        
        toast.style.borderColor = colors[type] || colors.info;
        toast.textContent = message;
        
        toast.addEventListener('click', () => this.remove(toast));
        
        this.container.appendChild(toast);
        this.toasts.push(toast);
        
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }
        
        return toast;
    }

    remove(toast) {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight var(--transition-base) ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                this.toasts = this.toasts.filter(t => t !== toast);
            }, 300);
        }
    }

    clear() {
        this.toasts.forEach(toast => this.remove(toast));
    }
}

// Global instances
window.ItemDataLoader = ItemDataLoader;
window.AnimationUtils = AnimationUtils;
window.SearchUtils = SearchUtils;
window.StorageUtils = StorageUtils;
window.ToastManager = ToastManager;

// Initialize global toast manager
window.toast = new ToastManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ItemDataLoader,
        AnimationUtils,
        SearchUtils,
        StorageUtils,
        ToastManager
    };
}