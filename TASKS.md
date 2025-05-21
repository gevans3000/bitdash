# BitDash - Task List

## 📊 Technical Analysis Improvements

### 1. Support and Resistance Levels (In Progress)
#### Backend
- [x] (2024-05-15) Create function to identify swing highs/lows from price data
- [x] (2024-05-16) Implement enhanced clustering algorithm to group nearby price levels:
  - [x] (2024-05-16) Add volume-weighted price zones
  - [x] (2024-05-16) Implement time-based decay for older levels
  - [ ] Add support for different timeframes (1h, 4h, 1d) - *Target: 2024-05-25*
  - [x] (2024-05-17) Optimize performance for real-time updates
- [x] (2024-05-17) Calculate strength score for each level based on:
  - [x] (2024-05-17) Number of touches
  - [x] (2024-05-17) Recency of touches
  - [x] (2024-05-17) Volume at touch points
  - [x] (2024-05-17) Time spent near the level
- [x] (2024-05-18) Add API endpoint to serve support/resistance data

#### Discovered During Work:
- [ ] Add support for dynamic timezone handling
- [ ] Implement caching for support/resistance calculations
- [ ] Add validation for input price data

#### Frontend
- [ ] Add support/resistance lines to price chart
- [x] Implement level strength visualization (line thickness/opacity)
- [x] Add tooltips showing level details (price, strength, last touch, date range)
- [x] Create toggle to show/hide support/resistance levels

### 2. Bollinger Bands (Completed: 2024-05-18) ✅
#### Backend
- [x] (2024-05-10) Implement standard deviation calculation helper
- [x] (2024-05-11) Add Bollinger Bands calculation (20-period SMA ± 2σ)
- [x] (2024-05-11) Calculate %B and Band Width indicators
- [x] (2024-05-12) Add Bands data to market data response

#### Frontend
- [x] (2024-05-13) Add Bollinger Bands visualization to price chart
- [x] (2024-05-13) Implement color-coded %B indicator
- [x] (2024-05-14) Add Band Width indicator display
- [x] (2024-05-14) Create visual indicator for price position between bands
- [ ] Add toggle for showing/hiding bands (if needed) - *Low Priority*
- [ ] Add tooltips explaining Bollinger Bands metrics - *Low Priority*

### 3. VWAP Integration (Planned)
#### Backend
- [ ] Add volume-weighted price calculation - *Target: 2024-06-01*
- [ ] Implement VWAP calculation for current session - *Target: 2024-06-01*
- [ ] Add VWAP data to market data response - *Target: 2024-06-02*
- [ ] Calculate price position relative to VWAP - *Target: 2024-06-02*

#### Frontend
- [ ] Add VWAP line to price chart - *Target: 2024-06-05*
- [ ] Implement price position indicator (above/below VWAP) - *Target: 2024-06-05*
- [ ] Add VWAP-based alerts - *Target: 2024-06-07*
- [ ] Create toggle for VWAP display - *Target: 2024-06-07*

### 4. Enhanced MACD Analysis (Planned)
#### Backend
- [ ] Add MACD line cross detection - *Target: 2024-06-10*
- [ ] Implement histogram color logic (bullish/bearish) - *Target: 2024-06-10*
- [ ] Add zero-line cross detection - *Target: 2024-06-11*
- [ ] Add signal generation for cross events - *Target: 2024-06-11*

#### Frontend
- [ ] Add colored MACD histogram - *Target: 2024-06-15*
- [ ] Implement signal line cross indicators - *Target: 2024-06-15*
- [ ] Add zero-line cross indicators - *Target: 2024-06-16*
- [ ] Add MACD settings panel - *Target: 2024-06-16*

### 5. RSI Improvements (Planned)
#### Backend
- [ ] Add RSI trend line calculation - *Target: 2024-06-20*
- [ ] Implement divergence detection - *Target: 2024-06-21*
- [ ] Add overbought/oversold threshold detection - *Target: 2024-06-21*
- [ ] Add RSI-based signals - *Target: 2024-06-22*

#### Frontend
- [ ] Add RSI trend lines to RSI chart - *Target: 2024-06-25*
- [ ] Implement divergence visualization - *Target: 2024-06-25*
- [ ] Add overbought/oversold zones - *Target: 2024-06-26*
- [ ] Add RSI settings panel - *Target: 2024-06-26*

### 6. On-Chain Metrics
#### Backend
- [ ] Add exchange flow data source
- [ ] Implement wallet activity tracking
- [ ] Add network health indicators
- [ ] Create API endpoints for on-chain data

#### Frontend
- [ ] Add on-chain metrics dashboard
- [ ] Implement exchange flow visualization
- [ ] Add wallet activity charts
- [ ] Create network health status panel

### 7. Market Context
#### Backend
- [ ] Integrate crypto news API
- [ ] Add regulatory tracking system
- [ ] Implement sentiment analysis
- [ ] Create news/sentiment endpoints

#### Frontend
- [ ] Add news feed component
- [ ] Implement regulatory update tracker
- [ ] Add sentiment indicators
- [ ] Create market context dashboard

### 8. Extended Timeframes
#### Backend
- [ ] Add 7-day performance calculation
- [ ] Implement 30-day analysis
- [ ] Add historical volatility calculation
- [ ] Update API to support multiple timeframes

#### Frontend
- [ ] Add timeframe selector
- [ ] Implement performance comparison view
- [ ] Add volatility indicators
- [ ] Create historical analysis view

## 🛠️ Infrastructure

### 9. Performance Optimization
- [ ] Implement data caching
- [ ] Add request batching
- [ ] Optimize chart rendering
- [ ] Add loading states

### 10. Testing (In Progress)
- [x] (2024-05-18) Set up Jest testing framework
- [x] (2024-05-18) Configure React Testing Library
- [ ] Add unit tests for indicators - *In Progress* - *Target: 2024-05-30*
  - [x] (2024-05-18) Bollinger Bands calculations
  - [ ] Support/Resistance calculations
  - [ ] Technical indicators utilities
- [ ] Implement integration tests - *Target: 2024-06-05*
  - [ ] Chart component interactions
  - [ ] Data fetching and state management
- [ ] Add end-to-end tests with Cypress - *Target: 2024-06-15*
  - [ ] Critical user journeys
  - [ ] Cross-browser testing
- [ ] Set up CI/CD pipeline - *Target: 2024-06-20*
  - [ ] GitHub Actions workflow
  - [ ] Automated deployments
  - [ ] Test coverage reporting

### 11. Server Refactor (2025-05-20)
- [x] Split large `index.js` into modules for API, caching, dashboard, and routes
- [x] Create centralized entry point loading these modules
- [ ] Write unit tests for API helpers
- [ ] Verify server startup and route responses

## 🔄 Discovered During Work

### Technical Debt
- [ ] Refactor chart component for better performance
- [ ] Optimize state management for large datasets
- [ ] Improve error handling for API failures

### Documentation
- [ ] Add JSDoc to all utility functions
- [ ] Create component documentation in Storybook
- [ ] Update README with new features

### Infrastructure
- [ ] Set up monitoring and error tracking
- [ ] Implement proper logging
- [ ] Add performance monitoring
