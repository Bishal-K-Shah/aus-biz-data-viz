# 🇦🇺 Australian Business Data Visualization Dashboard

An interactive data visualization dashboard showcasing Australian business analytics with multiple chart types and real-time data representation. Built as a portfolio project to develop skills in API and Data visualization.

![Dashboard Preview](https://img.shields.io/badge/Status-Demo-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 📊 Interactive Charts
- **Bar Charts**: State-by-state revenue comparison and city business activity
- **Line Charts**: Quarterly growth trends and monthly performance tracking
- **Pie Chart**: Industry distribution across Australian sectors
- **Doughnut Chart**: Employment breakdown by sector
- **Multi-dataset Visualizations**: Year-over-year comparisons

### 🎨 Design & UI
- Modern, responsive design
- Dark/Light theme toggle for user preference
- Smooth animations and transitions
- Interactive stat cards with key metrics

### 📈 Data Insights
- **Australian States Coverage**: NSW, VIC, QLD, WA, SA, TAS, ACT, NT
- **Major Cities**: Sydney, Melbourne, Brisbane, Perth, Adelaide, Canberra, and more
- **Industry Sectors**: Mining, Finance, Healthcare, Retail, Manufacturing, Construction, Education, Tourism
- **Key Metrics**: Revenue, profit, employment, business counts, growth rates

### 🌐 Data Integration
- **World Bank API**: Live Australian economic indicators (GDP, unemployment, population, inflation)
- **Automatic fallbacks**: Gracefully handles API failures with local demo data
- **Data Source Indicator**: Visual badge showing current data source (World Bank/Market/Demo)

### API Fallback

```
1. World Bank API (Primary)
   ↓ (on failure)
2. Market Data API (Secondary)
   ↓ (on failure)
3. Demo Data (Fallback)
```

### 🛠️ Technical Features
- Built with vanilla JavaScript with no framework dependencies
- Chart.js for high-performance data visualization
- **Real World Bank API integration** for authentic Australian economic data
- **Multiple data source fallbacks** (World Bank → Market data → Demo data)
- CSS custom properties for theming
- Fully responsive grid layouts
- Optimized for performance and accessibility
- **API Mode Toggle** - Switch between Real API and Demo modes
- **PDF Export** - High-quality report generation with jsPDF

## 🚀 Getting Started

### Installation

1. **Clone or Download** this repository to your local machine

2. **Open the project**
   ```bash
   cd data-visualization-tool
   ```

3. **Launch the dashboard**
   - Simply open `index.html` in your web browser
   - Or use a local development server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js http-server
     npx http-server
     ```

4. **View the dashboard**
   - Navigate to `http://localhost:8000` (if using a server)
   - Or directly open `index.html` in your browser

## 📁 Project Structure

```
data-visualization-tool/
│
├── index.html          # Main HTML structure
├── styles.css          # Complete styling and theming
├── script.js           # Chart logic and data handling
└── README.md          # Project documentation
```

## 🎯 Usage

### Interacting with the Dashboard

1. **View Charts**: Scroll through the dashboard to see different visualizations
2. **Hover for Details**: Hover over any chart element to see detailed tooltips
3. **Refresh Data**: Click the "Refresh Data" button to update charts with new variations
4. **Toggle Theme**: Click "Toggle Theme" to switch between light and dark modes
5. **API Mode Toggle**: Click "API Mode" button to switch between:
   - **Auto Mode**: Attempts real API data, then simulates realistic variations
   - **Demo Mode**: Uses static demonstration data
6. **Responsive View**: Resize your browser or view on mobile devices

### Customizing Data

To modify the data displayed in the charts, edit the `australianData` object in `script.js`:

```javascript
const australianData = {
    states: {
        labels: ['New South Wales', 'Victoria', ...],
        revenue: [485, 392, ...],
        businesses: [1850, 1520, ...]
    },
    // ... more data structures
};
```

## 🎨 Customization

### Changing Colors
Edit the CSS custom properties in `styles.css`:

```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #10b981;
    --accent-color: #f59e0b;
    /* ... more color variables */
}
```

## 📊 Data Context

The dashboard uses multiple data strategies:

1. **Auto Mode (Default)**:
   - Attempts to fetch real Australian market data via Yahoo Finance API
   - Falls back to simulated updates with ±5% realistic variations
   - Real-world API integration patterns

2. **Demo Mode**:
   - Uses static sample data representing Australian business metrics
   - Data includes realistic Australian business revenue by state (in millions AUD)
   - Industry distribution percentages
   - Employment figures across sectors
   - Business counts in major Australian cities
   - Quarterly and monthly performance trends


### Data Sources

The dashboard uses a **multi-tiered fallback system**:

1. **World Bank API** (Primary): Real economic indicators
   - GDP (current US$)
   - GDP growth (annual %)
   - Unemployment rate
   - Population data
   - Manufacturing value added
   - Exports/Imports
   - Inflation (CPI)

2. **Market Data** (Secondary): Public stock market indices

3. **Demo Data** (Fallback): Local demonstration data

### World Bank Indicators Used

| Indicator | Code | Description |
|-----------|------|-------------|
| GDP | NY.GDP.MKTP.CD | GDP in current US$ |
| GDP Growth | NY.GDP.MKTP.KD.ZG | Annual GDP growth % |
| Unemployment | SL.UEM.TOTL.ZS | Total unemployment % |
| Population | SP.POP.TOTL | Total population |
| Exports | NE.EXP.GNFS.ZS | Exports (% of GDP) |
| Imports | NE.IMP.GNFS.ZS | Imports (% of GDP) |
| Inflation | FP.CPI.TOTL.ZG | Consumer price inflation |
| Manufacturing | NV.IND.MANF.ZS | Manufacturing value added % |



### How It Works

```javascript
// API automatically fetches on page load and refresh
// Endpoint: https://api.worldbank.org/v2/country/AUS/indicator/{INDICATOR}?format=json

// Enable/disable real API in script.js:
const API_CONFIG = {
    USE_REAL_API: true,    // Set to false to use demo data only
    SIMULATE_API: false,   // Set to true for simulated variations
    USE_FALLBACK: true     // Set to false to require API success
};
```

### API Status Indicator

The dashboard displays the current data source in the header badge:
- 🟢 **"World Bank Data"** - Live API data loaded
- 🟡 **"Market Data"** - Public market data loaded
- 🔵 **"Demo Mode"** - Using local demonstration data

*The dashboard intelligently handles API failures and always displays meaningful data.*

## 🛠️ Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with Grid, Flexbox, and custom properties
- **JavaScript (ES6+)**: Chart logic and interactivity
- **Chart.js v4.4.0**: Professional chart rendering library
- **World Bank API**: Real Australian economic data
- **jsPDF v2.5.1**: High-quality PDF report generation

## 📱 Responsive Design

The dashboard is fully responsive with breakpoints at:
- **Desktop**: 1200px+ (full grid layout)
- **Tablet**: 768px - 1199px (adjusted grid)
- **Mobile**: <768px (single column layout)



## 👨‍💻 Author

Created as a project skills developing project showcasing

## 🙏 Acknowledgments

- **Chart.js** - For the excellent charting library
- **Australian Business Data** - Inspired by real Australian market sectors
- **Modern Web Design** - Following current best practices and trends

---

**Portfolio Demo Project** | Built with ❤️ by Bishal as a skills improvement project

*For more projects and information, visit my portfolio website* [here](https://bishalkshah.com.np)
