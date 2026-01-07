# Supply Chain Tracker - Design Guidelines

## Design Approach
**System-Based Approach**: Modern SaaS Dashboard Pattern
Drawing from Material Design for data-heavy applications combined with contemporary dashboard aesthetics (Linear, Vercel, Stripe Admin). This approach prioritizes data clarity, efficient workflows, and professional presentation while incorporating the requested visual flair through strategic accent usage.

## Core Design Principles
1. **Information Hierarchy First**: Data visualization and tracking information take precedence
2. **Real-time Clarity**: Live updates must be immediately visible without disrupting workflow
3. **Professional Blockchain Aesthetic**: Clean, technical, trustworthy appearance
4. **Efficient Multi-role Access**: Seamless switching between customer, admin, and manufacturer views

---

## Typography System

**Font Stack**: 
- Primary: Inter or DM Sans (modern, excellent readability for dashboards)
- Monospace: JetBrains Mono (for Product IDs, transaction hashes, blockchain data)

**Hierarchy**:
- Hero/Dashboard Title: text-4xl font-bold (36px)
- Section Headers: text-2xl font-semibold (24px)
- Card Titles: text-lg font-medium (18px)
- Body Text: text-base (16px)
- Labels/Metadata: text-sm font-medium (14px)
- Timestamps/Secondary: text-xs (12px)
- Monospace Data (IDs, hashes): text-sm font-mono

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16, 20, 24**
- Component padding: p-4, p-6, p-8
- Section margins: mb-8, mb-12, mb-16
- Card spacing: gap-6, space-y-4
- Grid gaps: gap-4, gap-6

**Container Strategy**:
- Max-width dashboard: max-w-7xl mx-auto
- Sidebar navigation: Fixed 240px (desktop), collapsible mobile
- Content area: flex-1 with px-6 py-8
- Modals/Overlays: max-w-2xl for forms, max-w-4xl for detail views

**Grid Patterns**:
- Quick Stats: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Product Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Analytics Charts: grid-cols-1 lg:grid-cols-2 gap-8
- Customer List: Single column with expandable rows

---

## Navigation & Layout Structure

**Primary Navigation** (Sidebar - Desktop, Bottom Nav - Mobile):
- Fixed left sidebar (w-60) with logo at top
- Navigation items with icons + labels
- Active state: Subtle emphasis with icon accent
- Sections: Dashboard, Products, Orders, Customers, Analytics, Support, Settings

**Top Bar** (Sticky):
- Left: Breadcrumb navigation (text-sm)
- Center: Global search bar (Product ID search) - max-w-md
- Right: Theme toggle, Notifications bell (with badge count), Profile avatar dropdown
- Height: h-16, shadow-sm

---

## Component Library

### Dashboard Cards
- **Quick Stats Cards**: 
  - Rounded corners (rounded-lg)
  - Padding: p-6
  - Icon in top-left (h-12 w-12 rounded-md p-2)
  - Value: text-3xl font-bold
  - Label: text-sm with trend indicator
  - Hover: Subtle lift (transform scale-[1.02] transition-transform)

### Product/Shipment Cards
- Border: border rounded-lg
- Image section: aspect-square with rounded-t-lg
- Content: p-4 space-y-3
- Product ID: font-mono text-xs truncate
- Title: text-lg font-semibold line-clamp-2
- Status badge: Inline with rounded-full px-3 py-1 text-xs font-medium
- Actions: Flex row gap-2 at bottom (Order, Wishlist icons)

### Tracking Timeline
- Vertical stepper design (border-l-2 with connecting line)
- Each step: pl-8 pb-8 relative
- Icon: Absolute positioned circle (w-6 h-6 rounded-full border-4)
- Active step: Larger icon (w-8 h-8), pulsing animation
- Timestamp: text-xs monospace
- Location/Status: text-sm font-medium
- Transaction hash: text-xs font-mono truncate with copy button

### Data Tables (Customer List, Order History)
- Sticky header with text-xs font-medium uppercase tracking-wider
- Row height: h-16 with px-6
- Hover: Subtle background shift
- Three-dot menu: Positioned right with dropdown (View Details, Contact)
- Expandable rows for additional info

### Chat Interface
- **Support Chat Window**: 
  - Fixed bottom-right (desktop): w-96 h-[600px]
  - Full screen (mobile)
  - Header: p-4 with customer name/avatar, minimize/close buttons
  - Message area: flex-1 overflow-y-auto p-4 space-y-3
  - Input: Sticky bottom with p-4, textarea with max-h-32
  
- **Prime AI Assistant Widget**:
  - Bottom-right corner (offset from chat if both open)
  - Minimized: w-14 h-14 rounded-full (pulsing glow effect)
  - Expanded: w-80 h-96 rounded-lg shadow-2xl
  - Messages: Left-aligned (AI), right-aligned (user)

### Modals & Overlays
- Backdrop: Semi-transparent overlay
- Modal container: rounded-xl shadow-2xl
- Header: p-6 border-b with close button
- Content: p-6 max-h-[70vh] overflow-y-auto
- Footer: p-6 border-t flex justify-end gap-3

### Forms
- Label: text-sm font-medium mb-2 block
- Input fields: h-10 px-4 rounded-md border
- Textareas: p-3 rounded-md min-h-[100px]
- Buttons: h-10 px-6 rounded-md font-medium
- File upload (Avatar): Rounded-full preview with crop overlay
- Validation errors: text-xs mt-1 (inline below field)

### Notification Bell
- Badge: Absolute top-0 right-0 w-5 h-5 rounded-full text-xs
- Dropdown: w-96 max-h-[500px] shadow-xl rounded-lg
- Notification items: p-4 border-b hover state
- Item structure: Icon (left), Content (center), Time (right), Unread dot

### Analytics Charts (Recharts)
- Container: bg-card p-6 rounded-lg
- Chart height: h-80
- Legend: Bottom positioned
- Tooltip: Custom styled with rounded corners
- Responsive: ResponsiveContainer width="100%"

---

## Interactive Tutorial (react-joyride)

- Spotlight: Non-blurred background, only highlighted element emphasized
- Tooltip: rounded-lg shadow-xl p-6 max-w-sm
- Content: text-sm leading-relaxed
- Navigation: Flex row justify-between mt-6
- NEXT button: Always visible, prominent styling
- Step counter: text-xs (Step 1 of 8)

---

## Animations & Transitions

**Page Transitions** (Framer Motion):
- Initial: opacity-0 y-8
- Animate: opacity-100 y-0
- Transition: duration-300 ease-out

**Micro-interactions**:
- Hover effects: scale-[1.02] or translate-y-[-2px]
- Active states: scale-[0.98]
- Loading states: Subtle pulse animation
- Notification badge: Pop-in animation (scale)
- Chart updates: Smooth number transitions

**Morphing Intro** (First Visit):
- Logo SVG morphs from abstract shape to final form (duration-1000)
- App name fades in with letter-by-letter reveal
- Transition to dashboard with smooth fade

---

## Responsive Breakpoints

- Mobile: Single column layouts, bottom navigation, full-width cards
- Tablet (md: 768px): 2-column grids, sidebar becomes drawer
- Desktop (lg: 1024px): Full multi-column layouts, fixed sidebar
- Wide (xl: 1280px): Max-width containers, optimized chart sizes

---

## Images

**Auto-Generated Logo**: 
- SVG with "SCT" initials in bold typography
- Small chain/link icon integrated
- Gradient background (gold → purple)
- Size: 40x40 (navbar), 120x120 (intro animation)
- Placement: Top-left navbar, center of intro screen

**Product Images**:
- Shoplist cards: aspect-square with object-cover
- Detail view: Larger preview with thumbnail carousel
- Fallback: Placeholder with product icon

**No hero images** - This is a dashboard application focused on functionality over marketing aesthetics.