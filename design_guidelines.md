# AI Agent Mobile App - Compact Design Guidelines

## Navigation & Architecture

### Tab Bar Navigation (4 tabs) + FAB
1. **Home** - AI chat interface
2. **Schedule** - Calendar and reminders
3. **Finances** - Balance sheet and transactions
4. **Profile** - Settings and account

**Floating Action Button (FAB):**
- Position: Bottom-right, above tab bar, on all screens
- Size: 56x56px, circular (radius: 28px)
- Background: Accent color (#8B5CF6)
- Icon: Feather microphone (white, 24x24px)
- Shadow: `{offset: {width: 0, height: 2}, opacity: 0.10, radius: 2}`
- Press: Scale to 0.95

### Authentication
- Primary: Google Sign-In (required for Calendar API)
- iOS: Apple Sign-In (App Store requirement)
- Account deletion: Profile > Account > Delete Account (double confirmation)

---

## Screen Layouts

### Safe Area Insets Pattern
- **Transparent headers**: `top: headerHeight + 24px`
- **Standard headers**: `top: 24px`
- **All screens**: `bottom: tabBarHeight + 24px` (+ input bar height if applicable)

### 1. Home (Chat Interface)
- **Header**: Transparent, "AI Assistant", settings icon (right)
- **Content**: FlatList of messages, quick action chips, fixed text input bar at bottom
- **Message bubbles**: User (right, accent bg), AI (left, surface bg), max-width 80%
- **Input bar**: Above tab bar, rounded container with send button

### 2. Schedule
- **Header**: Transparent, current month/year, "+" button (right)
- **Content**: Month calendar (expandable) + upcoming events list
- **Event cards**: Title, time, reminder badges (green=sent, yellow=pending)
- **Swipe actions**: Edit, delete

### 3. Add Event (Modal)
- **Header**: Standard, "Cancel" (left), "Save" (right, accent when valid)
- **Form fields**: Event name, date/time pickers, description, reminder toggles (2d, 1d, 6h, 1h), Google Calendar sync
- **Layout**: Keyboard-aware scroll view

### 4. Finances
- **Header**: Transparent, upload button (right, document icon)
- **Content**: Balance summary card (top) + sections: "Recent Transactions", "Monthly Summary" (bar chart)
- **Transactions**: Grouped by date, icon + description + amount (green/red)
- **Empty state**: "Upload bank statement to get started"

### 5. Upload Statement (Modal)
- **Header**: Standard, "Cancel" (left), "Process" (right, enabled after selection)
- **Content**: File picker area (dashed border) + processing indicator + transaction preview with categorization chips

### 6. Currency Converter (Modal)
- **Header**: Standard, "Close" (left), swap button (right)
- **Content**: Centered layout, from/to amount inputs (large), currency pickers, live rate timestamp

### 7. Profile/Settings
- **Header**: Transparent, "Profile"
- **Content**: Avatar + name (editable) + sectioned list (Account, Preferences, About)
- **Avatar options**: 4 preset geometric designs (modern, professional)

---

## Design System

### Colors
| Use Case | Light | Dark |
|----------|-------|------|
| Primary | #2563EB | #2563EB |
| Accent | #8B5CF6 | #8B5CF6 |
| Success | #10B981 | #10B981 |
| Warning | #F59E0B | #F59E0B |
| Error | #EF4444 | #EF4444 |
| Background | #FFFFFF | #0F172A |
| Surface | #F8FAFC | #1E293B |
| Border | #E2E8F0 | #334155 |
| Text Primary | #0F172A | #F8FAFC |
| Text Secondary | #64748B | #64748B |

**Financial**: Income/Positive: #10B981, Expense/Negative: #EF4444

### Typography (SF Pro/Roboto)
- **Hero**: 32px Bold (balances, currency)
- **H1**: 24px Bold (titles)
- **H2**: 20px Semibold (sections)
- **Body**: 16px Regular (content)
- **Caption**: 14px Regular (timestamps)
- **Small**: 12px Regular (helpers)

**Chat**: User: 16px Medium, AI: 16px Regular, Timestamps: 12px Regular (secondary color)

### Spacing Scale
`xs: 4px | sm: 8px | md: 12px | lg: 16px | xl: 24px | 2xl: 32px`

### Components

**Cards:**
- Radius: 12px, Padding: 16px, Border: 1px (border color, optional)
- Background: Surface color
- Subtle shadow for floating cards only

**Buttons:**
- Height: 48px, Radius: 8px, Padding: 24px horizontal
- **Primary**: Accent bg, white text, 16px semibold
- **Secondary**: Transparent bg, accent border/text
- **Text**: No bg, accent text
- Press: Opacity 0.9

**Input Fields:**
- Height: 48px, Radius: 8px, Padding: 12px horizontal
- Border: 1px (border color), Focus: 2px (accent)
- Background: Surface color

**Chat Bubbles:**
- Radius: 16px (4px on tail side)
- User: Accent bg, white text, right-aligned
- AI: Surface bg, text primary, left-aligned
- Max-width: 80%, Padding: 12px

**Charts:**
- Bars: Accent color, rounded tops (4px)
- Grid: Border color, 1px dashed
- Labels: 14px, text secondary
- No shadows

### Icons (Feather)
- **Sizes**: 20px (list items), 24px (headers), 32px (empty states), 48px (empty state illustrations)
- **Colors**: Text secondary (default), accent (active)
- **Navigation**: home, calendar, dollar-sign, user
- **Actions**: mic, send, plus, upload, settings, edit-2, trash-2, chevron-right, x, check, refresh-cw, alert-circle
- **Financial**: trending-up, trending-down, credit-card

### Interaction Patterns

**Touch Feedback:**
- Standard touchables: Opacity 0.6
- Floating buttons: Scale 0.95 + shadow
- Swipeable items: Horizontal slide with revealed actions

**Loading States:**
- Initial load: Skeleton screens with shimmer
- AI processing: Centered spinner (accent)
- File uploads: Progress bar
- Transaction lists: Shimmer effect

**Empty States:**
- Icon (48px, text secondary) + primary message (H2) + secondary message (Body, text secondary) + CTA button
- Centered layout

---

## Required Assets

### Generated (High Priority)
1. **Profile Avatars (4)**: Geometric, abstract professional, accent colors, 256x256px PNG/SVG
2. **Empty State Icons (3)**: Calendar, document, speech bubble - line art, accent color, match Feather style
3. **App Icon**: AI assistant concept (brain/chat hybrid), purple-blue gradient, 1024x1024px master

### System Icons
Use Feather icons from `@expo/vector-icons` - no custom illustrations needed.

---

## Critical Rules

**DO:**
- Use transparent headers for tab root screens
- Apply exact FAB shadow specs: `{width: 0, height: 2}, opacity: 0.10, radius: 2`
- Account for tab bar height in bottom safe area insets
- Use color-coded amounts (green=positive, red=negative)
- Show reminder status with colored badges
- Double-confirm account deletion

**DON'T:**
- Use emojis in production UI
- Add shadows to list items or chart elements
- Exceed 80% width for chat bubbles
- Enable "Save" button before form validation
- Show transaction data without uploaded statement