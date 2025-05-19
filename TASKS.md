# BitDash - Task List

## 📊 Technical Analysis Improvements

### 1. Support and Resistance Levels
#### Backend
- [x] Create function to identify swing highs/lows from price data
- [ ] Implement enhanced clustering algorithm to group nearby price levels:
  - [ ] Add volume-weighted price zones
  - [ ] Implement time-based decay for older levels
  - [ ] Add support for different timeframes (1h, 4h, 1d)
  - [ ] Optimize performance for real-time updates
- [ ] Calculate strength score for each level based on:
  - [ ] Number of touches
  - [ ] Recency of touches
  - [ ] Volume at touch points
  - [ ] Time spent near the level
- [ ] Add API endpoint to serve support/resistance data

#### Frontend
- [ ] Add support/resistance lines to price chart
- [ ] Implement level strength visualization (line thickness/opacity)
- [ ] Add tooltips showing level details (price, strength, last touch)
- [ ] Create toggle to show/hide support/resistance levels

### 2. Bollinger Bands
#### Backend
- [ ] Implement standard deviation calculation helper
- [ ] Add Bollinger Bands calculation (20-period SMA ± 2σ)
- [ ] Calculate %B and Band Width indicators
- [ ] Add Bands data to market data response

#### Frontend
- [ ] Add Bollinger Bands visualization to price chart
- [ ] Implement color-coded %B indicator
- [ ] Add Band Width indicator display
- [ ] Create toggle for showing/hiding bands

### 3. VWAP Integration
#### Backend
- [ ] Add volume-weighted price calculation
- [ ] Implement VWAP calculation for current session
- [ ] Add VWAP data to market data response
- [ ] Calculate price position relative to VWAP

#### Frontend
- [ ] Add VWAP line to price chart
- [ ] Implement price position indicator (above/below VWAP)
- [ ] Add VWAP-based alerts
- [ ] Create toggle for VWAP display

### 4. Enhanced MACD Analysis
#### Backend
- [ ] Add MACD line cross detection
- [ ] Implement histogram color logic (bullish/bearish)
- [ ] Add zero-line cross detection
- [ ] Add signal generation for cross events

#### Frontend
- [ ] Add colored MACD histogram
- [ ] Implement signal line cross indicators
- [ ] Add zero-line cross indicators
- [ ] Add MACD settings panel

### 5. RSI Improvements
#### Backend
- [ ] Add RSI trend line calculation
- [ ] Implement divergence detection
- [ ] Add overbought/oversold threshold detection
- [ ] Add RSI-based signals

#### Frontend
- [ ] Add RSI trend lines to RSI chart
- [ ] Implement divergence visualization
- [ ] Add overbought/oversold zones
- [ ] Add RSI settings panel

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

### 10. Testing
- [ ] Add unit tests for indicators
- [ ] Implement integration tests
- [ ] Add end-to-end tests
- [ ] Set up CI/CD pipeline
