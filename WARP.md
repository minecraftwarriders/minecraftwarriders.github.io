# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a static HTML documentation website for the "Minecraft War Riders" server, providing comprehensive wiki information and item pricing data. The project serves as both a player guide and reference documentation.

## Architecture

### Core Structure
- **`pages/wiki.html`**: Main wiki interface with comprehensive server documentation, plugin guides, and command references
- **`pages/items.html`**: Interactive item pricing display with live data integration
- **`pages/sections/*.yml`**: YAML configuration files containing structured item pricing data organized by categories
- **`assets/`**: Static assets including logos and test resources

### Key Components

**Wiki System (`pages/wiki.html`)**:
- Single-page application with JavaScript-driven section navigation
- Collapsible sidebar with categorized navigation (plugins, commands, social features)
- Search functionality across all content
- Responsive design with mobile optimization
- Comprehensive coverage of all server plugins and commands

**Item Pricing System (`pages/items.html` + `pages/sections/*.yml`)**:
- YAML-based data structure for item definitions with buy/sell prices
- Categories include: Automation, Blocks, Food, Farming, Ores, Potions, Redstone, etc.
- Each YAML file represents a category with paginated item listings
- Support for special items like AutoSell chests with custom properties

**Data Architecture**:
```
pages/sections/
├── Automation.yml (AutoSell chests, special items)
├── Blocks.yml (Building materials, decorative blocks)
├── Food.yml (Consumables, cooked/raw items)
├── Farming.yml (Crops, seeds, farming supplies)
├── [Other categories].yml
```

### Content Management

**Plugin Documentation Structure**:
The wiki covers essential server plugins:
- **EssentialsX**: Core teleportation, economy, communication
- **AuraSkills**: Skill system with leveling progression
- **EconomyShopGUI**: Main server shop integration
- **AutoSellChests**: Automated selling system for farms
- **Marriage, Banking, Trading**: Social and economic features
- **Building Tools**: WorldEdit, BigDoors, Movecraft, Animated Architecture

**Item Pricing Data**:
- YAML structure: `material`, `buy`, `sell` prices
- Special properties for unique items (e.g., `autosell: true`)
- Paginated organization for large item sets
- Support for items that can't be sold back (`sell: -1.0`)

## Development Workflow

### Updating Wiki Content
1. Edit `pages/wiki.html` directly for content changes
2. Sections are managed through JavaScript `showSection()` function
3. Navigation structure is maintained in sidebar HTML
4. Search functionality indexes all visible text content

### Updating Item Prices
1. Modify relevant YAML files in `pages/sections/`
2. Follow existing structure: `material`, `buy`, `sell` properties
3. Use Minecraft material names (e.g., `STONE`, `COOKED_BEEF`)
4. Set `sell: -1.0` for non-sellable items
5. Add special properties as needed (e.g., `autosell`, `lore`, `name`)

### Asset Management
- Logo and graphics in `assets/` directory
- Referenced via GitHub raw URLs in production
- Test assets stored locally for development

### Style Guidelines
- Consistent emoji usage for visual categorization (⚡, 💰, 🏗️, etc.)
- Color-coded information boxes (tips, warnings, important notes)
- Command syntax highlighting with monospace formatting
- Responsive design considerations for mobile users

## File Organization Patterns

**HTML Structure**:
- Self-contained files with embedded CSS and JavaScript
- No build process required - direct browser compatibility
- Modular section-based content organization

**YAML Data Structure**:
```yaml
pages:
  page1:
    gui-rows: 6  # UI layout hint
    items:
      '1':
        material: ITEM_NAME
        buy: 10.0
        sell: 2.5
        # Optional properties:
        lore: ['&cSpecial description']
        name: '§7§lCustom Name'
        autosell: true
```

**Navigation Hierarchy**:
- Main categories in sidebar with expand/collapse functionality
- Cross-referenced command listings organized by function
- Plugin-specific sections with comprehensive command coverage

This project emphasizes content accessibility and comprehensive server documentation, making it easy for players to find information about commands, prices, and server features.