# BitDash - Bitcoin Dashboard - Project Planning

## Project Overview
BitDash is a modern, real-time Bitcoin dashboard that provides users with key metrics, price information, and market data for Bitcoin. The dashboard will feature clean, responsive design and real-time updates.

## Architecture
- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Data Fetching**: API integration with CoinGecko/Binance/Kraken
- **Build Tool**: Vite

## Components
1. **Price Display**
   - Current BTC price (USD, EUR, etc.)
   - 24h price change percentage
   - Price chart (24h, 7d, 30d, 1y)

2. **Market Data**
   - Market Cap
   - 24h Trading Volume
   - Circulating Supply
   - All-time High/Low

3. **Portfolio Tracker (Future)**
   - Portfolio value over time
   - Asset allocation
   - Performance metrics

4. **News & Updates**
   - Latest Bitcoin news
   - Network updates
   - Important announcements

## File Structure
```
bitdash/
├── public/                      # Static files
├── src/
│   ├── assets/                  # Images, fonts, etc.
│   ├── components/
│   │   ├── common/             # Reusable UI components
│   │   ├── dashboard/           # Dashboard components
│   │   └── layout/              # Layout components
│   ├── hooks/                   # Custom React hooks
│   ├── services/                # API services
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   ├── App.tsx                  # Main App component
│   └── main.tsx                 # Entry point
├── .env                         # Environment variables
├── .gitignore
├── package.json
├── README.md
├── tsconfig.json               # TypeScript config
└── vite.config.ts              # Vite config
```

## Implementation Details

### Data Fetching
- Use React Query for data fetching and caching
- Implement error boundaries for graceful error handling
- Add loading states for better UX
- Implement data refresh intervals

### Styling
- Use Tailwind CSS for utility-first styling
- Implement dark/light mode
- Ensure mobile responsiveness
- Use CSS variables for theming

### State Management
- React Query for server state
- React Context for app-wide state (e.g., theme, currency)
- Local storage for user preferences

## Style Guidelines
- Follow React best practices
- Use functional components with hooks
- Implement proper TypeScript types
- Follow consistent naming conventions
- Use ESLint and Prettier for code formatting

## Testing Strategy

### Unit Testing
- Test all utility functions with 100% coverage
- Test custom hooks in isolation
- Mock external dependencies
- Include edge cases and error conditions

### Component Testing
- Use React Testing Library for all components
- Test component rendering with different props
- Test user interactions
- Test error boundaries

### Integration Testing
- Test component interactions
- Test data flow between components
- Test API integrations with MSW (Mock Service Worker)

### End-to-End Testing
- Critical user journeys with Cypress
- Cross-browser testing
- Performance testing for critical paths

### Test Structure
```
__tests__/
  ├── unit/           # Unit tests
  ├── components/      # Component tests
  ├── integration/     # Integration tests
  └── e2e/            # End-to-end tests
```

## Code Style & Conventions

### General
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use ES6+ features
- Prefer functional programming patterns
- Use named exports over default exports

### Naming Conventions
- Components: PascalCase (`Button.jsx`)
- Utilities/Functions: camelCase (`formatDate.js`)
- Constants: UPPER_SNAKE_CASE (`API_ENDPOINTS.js`)
- Test files: `ComponentName.test.jsx`

### File Structure
- Keep files under 500 lines
- One component per file
- Co-locate tests with source files
- Group by feature, not by type

### Documentation
- Document all props with PropTypes or TypeScript
- Use JSDoc for complex functions
- Keep READMEs updated
- Document component examples in Storybook

### Linting & Formatting
- ESLint with Airbnb config
- Prettier for code formatting
- Husky pre-commit hooks
- Lint-staged for optimized commits

## Dependencies
- React 18+
- TypeScript
- Tailwind CSS
- React Query
- Vite
- Axios (for API requests)
- date-fns (for date manipulation)
- recharts (for charts)

## Future Enhancements
1. User authentication
2. Portfolio tracking
3. Price alerts
4. More cryptocurrency support
5. Advanced charting tools
6. Mobile app version

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with required API keys
4. Start development server: `npm run dev`
5. Build for production: `npm run build`
