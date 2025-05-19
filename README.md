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

3. Create a `.env` file in the root directory and add your API keys:
   ```env
   VITE_COINGECKO_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🛠 Tech Stack

- **Framework**: [React 18](https://reactjs.org/) with TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [React Query](https://tanstack.com/query/latest)
- **Data Fetching**: [Axios](https://axios-http.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Linting/Formatting**: ESLint + Prettier

## 📚 API Reference

BitDash uses the following public APIs:

- [CoinGecko API](https://www.coingecko.com/en/api)
- [Binance API](https://binance-docs.github.io/apidocs/)
- [Kraken API](https://docs.kraken.com/rest/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) to get started.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Contact

Greg Evans - [@gevans3000](https://twitter.com/gevans3000) - gevans3000@gmail.com

Project Link: [https://github.com/gevans3000/bitdash](https://github.com/gevans3000/bitdash)

## 🙏 Acknowledgments

- [CoinGecko](https://www.coingecko.com/) for their free API
- [Tailwind CSS](https://tailwindcss.com/) for the amazing utility-first CSS framework
- [Vite](https://vitejs.dev/) for the fast development experience
