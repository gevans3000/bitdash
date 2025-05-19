# BitDash - Modern Bitcoin Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A sleek, real-time Bitcoin dashboard that provides comprehensive market data, price charts, and portfolio tracking in a clean, responsive interface.

![BitDash Preview](public/bitdash-preview.png)

## ✨ Features

- 📈 Real-time Bitcoin price tracking
- 📊 Interactive price charts (24h, 7d, 30d, 1y)
- 💰 Market data including market cap, volume, and supply
- 📊 Advanced Technical Indicators:
  - 📉 Bollinger Bands with %B and Band Width
  - 📊 Support and Resistance Levels
  - 📈 Moving Averages
  - 📉 RSI (Relative Strength Index)
  - 📊 MACD (Moving Average Convergence Divergence)
- 🌓 Dark/light mode
- 📱 Fully responsive design
- ⚡ Built with Vite for fast development and builds

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm 7+
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gevans3000/bitdash.git
   cd bitdash
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Get a free API key from [CoinGecko](https://www.coingecko.com/en/api) if you need higher rate limits.
   Create a `.env` file in the root directory and add your API key:
   ```env
   COINGECKO_API_KEY=your_api_key_here
   ```
   
   Note: The app will work without an API key, but with lower rate limits.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## 📡 Free API Usage

This project uses the following free APIs and data sources:

- **CoinGecko API** (Free tier)
  - Rate limits: 10-50 calls/minute (without API key), higher with API key
  - No payment required
  - Public data only
  - [CoinGecko API Documentation](https://www.coingecko.com/en/api)

- **Technical Indicators**
  - Calculated client-side using open-source libraries
  - No external API calls needed
  - No rate limits

### Rate Limiting and Caching

To respect API rate limits and provide a smooth experience:
- Data is cached in memory
- API calls are debounced
- The UI shows when data was last updated
- Error handling for rate limits is implemented

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🛠 Tech Stack

### Free and Open Source
All components and libraries used in this project are free and open source:
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Data**: CoinGecko API (free tier)
- **Charts**: Chart.js (client-side rendering)
- **Technical Analysis**: Custom implementation using standard formulas

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run unit tests
npm test:unit

# Run component tests
npm test:components

# Run integration tests
npm test:integration

# Run end-to-end tests
npm test:e2e

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
__tests__/
  ├── unit/           # Unit tests for utilities and hooks
  ├── components/      # Component tests
  ├── integration/     # Integration tests
  └── e2e/            # End-to-end tests
```

## 🎨 Code Style

We follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) with some modifications:

### Linting
```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

### Formatting
```bash
# Run Prettier
npm run format
```

### Git Hooks
- Pre-commit: Runs linting and formatting
- Pre-push: Runs tests

### File Structure
```
src/
  ├── assets/         # Static assets
  ├── components/     # Reusable components
  ├── hooks/         # Custom React hooks
  ├── services/      # API services
  ├── styles/        # Global styles
  ├── types/         # TypeScript type definitions
  ├── utils/         # Utility functions
  ├── App.tsx        # Main App component
  └── main.tsx       # Entry point
```

### Naming Conventions
- **Components**: PascalCase (`Button.tsx`)
- **Utilities/Functions**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **Test files**: `ComponentName.test.tsx`
- **Custom hooks**: `useFeatureName.ts`
- **Type definitions**: `featureName.types.ts`

## 🛠 Development Workflow

1. **Branch Naming**
   - `feature/` - New features
   - `fix/` - Bug fixes
   - `chore/` - Maintenance tasks
   - `docs/` - Documentation updates

2. **Commit Message Format**
   ```
   type(scope): short description
   
   [optional body]
   
   [optional footer]
   ```
   
   Example:
   ```
   feat(chart): add Bollinger Bands indicator
   
   - Implemented 20-period SMA with 2 standard deviation bands
   - Added %B and Band Width calculations
   - Added visual indicators for overbought/oversold conditions
   
   Closes #123
   ```

3. **Pull Requests**
   - Reference related issues
   - Add screenshots for UI changes
   - Ensure all tests pass
   - Get at least one review before merging

### Bollinger Bands
- 20-period SMA with 2 standard deviation bands
- %B indicator showing price position within bands
- Band Width indicator showing volatility
- Visual representation of price position between bands
- All calculations done client-side with no external API calls

### Support & Resistance
- Dynamic detection of key price levels
- Volume-weighted clustering
- Time-decay for older levels
- Strength scoring based on multiple factors

### Other Indicators
- RSI (14-period)
- MACD (12, 26, 9)
- 50-period SMA
- Volume analysis

## 🛠️ Built With

- [React](https://reactjs.org/) - JavaScript library for building user interfaces
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Chart.js](https://www.chartjs.org/) - Simple yet flexible JavaScript charting
- [CoinGecko API](https://www.coingecko.com/en/api) - Cryptocurrency market data
- [TypeScript](https://www.typescriptlang.org/) - TypeScript for type safety
- [Technical Indicators](https://www.npmjs.com/package/technicalindicators) - For advanced technical analysis

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) to get started.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🚀 Deployment

### Production Build
```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
VITE_APP_COINGECKO_API_KEY=your_api_key_here
VITE_APP_ENV=development
```

## 📧 Contact

Greg Evans - [@gevans3000](https://twitter.com/gevans3000) - gevans3000@gmail.com

Project Link: [https://github.com/gevans3000/bitdash](https://github.com/gevans3000/bitdash)

## 🙏 Acknowledgments

- [CoinGecko](https://www.coingecko.com/) for their free API
- [Tailwind CSS](https://tailwindcss.com/) for the amazing utility-first CSS framework
- [Vite](https://vitejs.dev/) for the fast development experience
