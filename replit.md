# AI Assistant Mobile App

## Overview

This is a cross-platform mobile AI assistant application built with React Native and Expo. The app provides three core features: conversational AI chat, intelligent scheduling with reminders, and personal finance management with expense tracking and currency conversion. It uses a tab-based navigation pattern with a floating action button for voice input, and implements a modern, themeable UI that adapts to light and dark modes.

## Recent Changes

**November 20, 2025**
- Implemented multi-provider AI system with automatic fallback: Gemini → OpenAI → Local Finance Fallback
- Added retry logic with exponential backoff (3 attempts, 500ms-5s delay) for all AI providers
- Enforced financial context limiting across ALL chat interactions - app now finance-focused only
- Non-financial queries receive polite redirect to finance topics
- Integrated Google Gemini AI (gemini-1.5-flash) and OpenAI (gpt-3.5-turbo) for intelligent responses
- Moved plus icon from chat input to Schedule screen FAB for adding new events
- Chat FAB shows microphone icon for voice input, Schedule FAB shows plus icon for adding events
- Repositioned microphone FAB to dynamically sit above chat input using measured container height
- Fixed missing BorderRadius import in ChatScreen.tsx
- Updated Expo packages to recommended versions (expo@~54.0.25, expo-glass-effect@~0.1.7, expo-linking@~8.0.9, expo-splash-screen@~31.0.11)
- **Security Note**: AI API keys are called directly from client (keys in bundle). For production, move to backend server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Navigation**
- Built on React Native 0.81.5 with Expo SDK 54
- Uses React Navigation v7 with bottom tabs and native stack navigators
- Four main tabs: Chat (Home), Schedule, Finances, and Settings (Profile)
- Path aliasing configured via Babel (`@/` maps to project root)

**UI/UX Design Patterns**
- Theme system with light/dark mode support using custom `useTheme` hook
- Centralized design tokens in `constants/theme.ts` for colors, spacing, typography, shadows, and border radius
- Safe area management with `react-native-safe-area-context` for proper insets
- Custom screen wrappers (`ScreenScrollView`, `ScreenFlatList`, `ScreenKeyboardAwareScrollView`) that automatically apply consistent padding and handle keyboard interactions
- Animated interactions using Reanimated v4 with spring physics for buttons, cards, and press states
- Floating Action Button (FAB) positioned above tab bar on all screens for voice input

**Component Architecture**
- Themed wrapper components (`ThemedView`, `ThemedText`) for consistent styling
- Reusable UI components with built-in animations (Button, Card, MessageBubble, EventCard, TransactionItem)
- Error boundary implementation for graceful error handling
- Custom header title component with app icon

### State Management & Data Persistence

**Local Storage**
- AsyncStorage used for all data persistence
- Centralized storage service (`services/storage.ts`) managing:
  - Chat messages
  - Calendar events
  - Financial transactions
  - User profile (name, avatar selection)
- Data serialization with proper Date object handling

**Screen State**
- Component-level state using React hooks
- `useIsFocused` hook to reload data when screens become active
- No global state management library (Redux/MobX) - keeps architecture simple

### AI & Natural Language Processing

**Intent Recognition**
- Basic NLU implemented in `services/aiService.ts`
- Pattern matching and keyword detection for intents:
  - Schedule meetings/events
  - Currency conversion
  - Expense analysis
  - General conversation
- Entity extraction using regex patterns for dates, amounts, currencies

**Voice Integration**
- Text-to-speech via `expo-speech`
- Voice service wrapper (`services/voiceService.ts`) with configurable language, pitch, and rate
- Voice input UI through FAB (floating action button), though actual speech-to-text implementation is not yet connected

### Scheduling & Reminders System

**Calendar Management**
- Mock calendar service with local AsyncStorage (production would integrate Google Calendar API via googleapis package)
- Event creation, updating, and deletion
- CRUD operations for events with validation

**Reminder System**
- Multi-level reminders: 2 days, 1 day, 6 hours, and 1 hour before events
- `expo-notifications` integration for local notifications
- Reminder scheduling service (`services/notificationService.ts`) that calculates trigger times
- Tracks which reminders have been sent to avoid duplicates

**Smart Scheduling Features**
- Recurring pattern detection (`services/schedulingService.ts`)
- Analyzes events to identify daily, weekly, biweekly, monthly, or custom patterns
- Confidence scoring based on interval consistency
- Scheduling suggestions with conflict detection

### Financial Management

**Transaction Processing**
- OCR-based bank statement parsing (`services/ocrService.ts`)
- Support for multiple bank statement formats (Chase, Bank of America, Wells Fargo)
- Pattern matching for extracting transaction date, description, and amount
- Manual transaction entry support

**Transaction Categorization**
- AI-powered categorization using Replit AI API
- Predefined income and expense categories
- Confidence scoring for category assignments
- Subcategory support for detailed expense tracking

**Currency Conversion**
- Real-time exchange rates via exchangerate-api.com
- Support for popular currencies (USD, EUR, GBP, JPY, CAD, AUD, etc.)
- Conversion history tracking

**Investment Tracking**
- Stock quote fetching via Yahoo Finance API
- Portfolio management with holdings tracking
- Gain/loss calculations
- Real-time price updates

**Financial Reporting**
- PDF generation using `expo-print`
- Balance sheet with income, expenses, and net balance
- Transaction categorization breakdown
- Monthly trend analysis
- PDF sharing via `expo-sharing`

### Platform-Specific Considerations

**Cross-Platform Support**
- Web fallbacks for native-only features (KeyboardAwareScrollView)
- Platform-specific styling (iOS blur effects vs Android solid backgrounds)
- Conditional rendering based on Platform.OS

**iOS Specific**
- Glass/blur effects using `expo-blur`
- Apple Sign-In support (not yet implemented)
- Tab bar transparency with blur

**Android Specific**
- Edge-to-edge display support
- Adaptive icons with foreground, background, and monochrome variants
- Material design elevation

**Replit Deployment**
- Custom build script (`scripts/build.js`) for static hosting
- Environment variable handling for REPLIT_DEV_DOMAIN and REPLIT_INTERNAL_APP_DOMAIN
- QR code landing page for mobile device testing

## External Dependencies

### Core Frameworks
- **React Native 0.81.5**: Mobile app framework
- **Expo SDK 54**: Development platform and native module access
- **React Navigation v7**: Bottom tabs and stack navigation

### UI & Animations
- **react-native-reanimated v4**: High-performance animations
- **react-native-gesture-handler**: Touch gesture handling
- **expo-blur**: iOS blur effects
- **@expo/vector-icons (Feather)**: Icon library

### Device Features
- **expo-notifications**: Local push notifications for reminders
- **expo-speech**: Text-to-speech for voice responses
- **expo-haptics**: Haptic feedback for interactions
- **react-native-keyboard-controller**: Advanced keyboard handling

### Data & Storage
- **@react-native-async-storage/async-storage**: Local key-value storage
- **expo-document-picker**: File selection for bank statement uploads

### Financial Services
- **exchangerate-api.com**: Currency conversion rates (free tier, no auth required)
- **Yahoo Finance API**: Stock quotes and market data (unofficial, no auth)

### AI Services
- **Replit AI API**: Transaction categorization (requires Replit environment)
- **googleapis**: Google Calendar API integration (configured but not fully implemented)

### Document Processing
- **expo-print**: PDF generation for financial reports
- **expo-sharing**: Cross-platform file sharing

### Development Tools
- **TypeScript**: Type safety
- **ESLint + Prettier**: Code quality and formatting
- **babel-plugin-module-resolver**: Path aliasing

### Future Integration Points
- Google Calendar API (OAuth 2.0 authentication required)
- Speech-to-text service (Google Cloud Speech-to-Text or Azure)
- Backend API for user authentication and data sync
- Cloud storage for bank statement processing