# 🤖 AI-Powered Hyperliquid Trading System

> **NullShot Hackathon Season 0 Submission**

Automated trading system using 6 specialized MCPs and NullShot Agent Framework to achieve 2%+ monthly returns on Hyperliquid.

## 🏗️ Architecture

- **6 MCPs**: News Sentiment, Orderbook Analysis, Technical Indicators, Signal Generation, Trading Execution, Performance Tracking
- **NullShot Agent**: Orchestrates MCPs with AI decision-making
- **Cloudflare Infrastructure**: Serverless deployment with D1 database
- **React Frontend**: Thirdweb wallet integration

## 🚀 Quick Start
```bash
# Install dependencies
npm install

# Setup database
npm run setup

# Deploy MCPs
npm run deploy:mcps

# Deploy agent
npm run deploy:agent

# Deploy frontend
npm run deploy:frontend
```

## 📊 Features

- ✅ Real-time news sentiment analysis
- ✅ Orderbook imbalance detection
- ✅ Technical indicator calculations (RSI, MACD, MA)
- ✅ Automated TP/SL order placement
- ✅ Monthly performance tracking
- ✅ Multi-user support with risk preferences

## 🎯 Hackathon Category

**Track 1a**: MCPs/Agents using NullShot Framework

## 📝 License

MIT
