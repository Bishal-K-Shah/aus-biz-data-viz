# World Bank API Integration Guide

## Overview

The Australian Business Data Visualization Dashboard integrates with the **World Bank Open Data API** to fetch Australian economic indicators. This provides authentic, authoritative data without requiring any backend infrastructure.

## Why World Bank API?

✅ **No CORS restrictions** - Works directly from browser  
✅ **No rate limiting concerns** - Generous usage allowances  
✅ **Authoritative data** - Official economic statistics  

## API Endpoints Used

Base URL: `https://api.worldbank.org/v2`

### Australian Economic Indicators

| Indicator | API Code | Endpoint |
|-----------|----------|----------|
| GDP (current US$) | NY.GDP.MKTP.CD | `/country/AUS/indicator/NY.GDP.MKTP.CD?format=json` |
| GDP Growth (annual %) | NY.GDP.MKTP.KD.ZG | `/country/AUS/indicator/NY.GDP.MKTP.KD.ZG?format=json` |
| Unemployment Rate | SL.UEM.TOTL.ZS | `/country/AUS/indicator/SL.UEM.TOTL.ZS?format=json` |
| Population Total | SP.POP.TOTL | `/country/AUS/indicator/SP.POP.TOTL?format=json` |
| Exports (% of GDP) | NE.EXP.GNFS.ZS | `/country/AUS/indicator/NE.EXP.GNFS.ZS?format=json` |
| Imports (% of GDP) | NE.IMP.GNFS.ZS | `/country/AUS/indicator/NE.IMP.GNFS.ZS?format=json` |
| Inflation (CPI) | FP.CPI.TOTL.ZG | `/country/AUS/indicator/FP.CPI.TOTL.ZG?format=json` |
| Manufacturing (% of GDP) | NV.IND.MANF.ZS | `/country/AUS/indicator/NV.IND.MANF.ZS?format=json` |

## Implementation Details

### Fetching Data

```javascript
async function fetchWorldBankData() {
    const indicators = {
        gdp: 'NY.GDP.MKTP.CD',
        gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
        unemployment: 'SL.UEM.TOTL.ZS',
        population: 'SP.POP.TOTL',
        // ... more indicators
    };
    
    const promises = Object.entries(indicators).map(async ([key, indicatorCode]) => {
        const url = `${API_CONFIG.WORLD_BANK_BASE}/country/${API_CONFIG.WORLD_BANK_COUNTRY}/indicator/${indicatorCode}?format=json&per_page=10&date=2015:2024`;
        const response = await fetch(url);
        const data = await response.json();
        return { key, data: data[1] }; // data[0] is metadata, data[1] is actual values
    });
    
    const results = await Promise.all(promises);
    processWorldBankData(results);
}
```

### Data Transformation

The raw World Bank data is transformed to fit the dashboard's visualizations:

| World Bank Data | Dashboard Usage |
|-----------------|-----------------|
| GDP (US$ billions) | → Quarterly revenue trends |
| GDP Growth % | → Monthly revenue growth patterns |
| Unemployment % | → Employment sector adjustments |
| Population by year | → City business distribution |
| Manufacturing % | → Industry sector percentages |
| Exports/GDP ratio | → Mining & Resources sector weight |

### Fallback System

```
1. World Bank API (Primary)
   ↓ (on failure)
2. Market Data API (Secondary)
   ↓ (on failure)
3. Demo Data (Fallback)
```

## API Response Format

### Example Response Structure

```json
[
  {
    "page": 1,
    "pages": 1,
    "per_page": 10,
    "total": 10
  },
  [
    {
      "indicator": {
        "id": "NY.GDP.MKTP.CD",
        "value": "GDP (current US$)"
      },
      "country": {
        "id": "AUS",
        "value": "Australia"
      },
      "countryiso3code": "AUS",
      "date": "2023",
      "value": 1675418965120.45,
      "unit": "",
      "obs_status": "",
      "decimal": 2
    },
    // ... more years
  ]
]
```

## Configuration

### Enable/Disable Real API

In `script.js`, adjust the `API_CONFIG`:

```javascript
const API_CONFIG = {
    WORLD_BANK_BASE: 'https://api.worldbank.org/v2',
    WORLD_BANK_COUNTRY: 'AUS',
    USE_REAL_API: true,      // Set false to disable World Bank API
    SIMULATE_API: false,     // Set true for simulated data variations
    USE_FALLBACK: true       // Set false to require API success
};
```

## Data Update Flow

1. **Page Load** → Automatically calls `fetchABSData()`
2. **Fetch World Bank Data** → Retrieves last 10 years of economic indicators
3. **Process Data** → Transforms indicators into dashboard-compatible format
4. **Update Charts** → Refreshes all visualizations with real data
5. **Update Stats** → Recalculates stat cards with new values
6. **Show Badge** → Displays "World Bank Data" indicator

## Error Handling

The implementation includes robust error handling:

- **Network Errors**: Falls back to secondary data sources
- **Invalid Responses**: Validates data before processing
- **Missing Data**: Filters null values and uses available years
- **API Timeouts**: Shows loading indicator, then falls back
- **User Feedback**: Displays data source badge and error messages

## Testing

### Check Console Output

Open browser DevTools Console to see:
```
Fetching real data from World Bank API...
Processed World Bank data: {gdp: Array(10), gdpGrowth: Array(10), ...}
World Bank data successfully fetched and processed
```

### Verify Data Source Badge

The header badge should display:
- 🟢 **"World Bank Data"** - API successfully loaded
- 🔵 **"Demo Mode"** - Using fallback data

## Performance

- **Initial Load**: ~2-3 seconds (8 parallel API calls)
- **Caching**: Browser automatically caches responses
- **Refresh**: Click "Refresh Data" to re-fetch latest values
- **Optimized**: Uses `Promise.all()` for concurrent requests

## Limitations

- **Historical Data Only**: World Bank updates annually (latest: 2023/2024)
- **No Real-Time Updates**: Data updated quarterly by World Bank
- **Country-Level Only**: State/city data approximated from national figures
- **Annual Frequency**: Most indicators published yearly, not monthly

## Future Enhancements

- [ ] Add Alpha Vantage for real-time ASX stock data
- [ ] Cache World Bank responses in localStorage
- [ ] Add date range selector for historical comparisons
- [ ] Display data freshness timestamp
- [ ] Add more economic indicators (trade balance, FDI, etc.)

## Resources

- [World Bank Open Data API Documentation](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation)
- [World Bank Data Catalog](https://data.worldbank.org/)
- [Australia Country Page](https://data.worldbank.org/country/australia)
- [API Query Tool](https://data.worldbank.org/country/australia?view=chart)

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify internet connection (API requires network access)
3. Try toggling API mode off/on
4. Refresh page to retry API calls

---

**API Version**: World Bank API v2  
**Status**: ✅ Production Ready
