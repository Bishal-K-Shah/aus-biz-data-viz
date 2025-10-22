// Australian Business Data - Enhanced with World Bank API integration
const australianData = {
    states: {
        labels: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'ACT', 'NT'],
        revenue: [485, 392, 287, 218, 125, 47, 89, 32],
        businesses: [1850, 1520, 1180, 890, 520, 195, 380, 145]
    },
    industries: {
        labels: ['Mining & Resources', 'Finance & Insurance', 'Healthcare', 'Retail Trade', 'Manufacturing', 'Construction', 'Education', 'Tourism & Hospitality'],
        values: [22, 18, 15, 12, 11, 9, 8, 5],
        colors: ['#f59e0b', '#2563eb', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']
    },
    quarters: {
        labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025'],
        revenue: [1245, 1358, 1425, 1532, 1675],
        profit: [186, 203, 214, 230, 251]
    },
    employment: {
        labels: ['Professional Services', 'Retail & Hospitality', 'Healthcare & Social', 'Manufacturing', 'Construction', 'Other'],
        values: [285000, 312000, 268000, 195000, 178000, 145000],
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b']
    },
    monthly: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        revenue2024: [125, 118, 142, 138, 156, 148, 162, 159, 174, 168, 185, 178],
        revenue2025: [142, 138, 155, null, null, null, null, null, null, null, null, null]
    },
    cities: {
        labels: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Gold Coast', 'Newcastle', 'Hobart', 'Darwin'],
        businesses: [2850, 2420, 1680, 1250, 780, 520, 485, 395, 285, 210],
        colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1']
    }
};

// API Configuration
const API_CONFIG = {
    // World Bank API - No CORS issues, no API key needed
    WORLD_BANK_BASE: 'https://api.worldbank.org/v2',
    WORLD_BANK_COUNTRY: 'AUS', // Australia
    // Using CORS proxy for ABS data
    CORS_PROXY: 'https://api.allorigins.win/raw?url=',
    // Alternative: Australian Government Open Data
    DATA_GOV_AU: 'https://data.gov.au/data/api/3/action/datastore_search',
    // RBA (Reserve Bank of Australia) - CSV endpoint
    RBA_STATS: 'https://www.rba.gov.au/statistics/tables/csv/f11.csv',
    // Fallback to demo data if API fails
    USE_FALLBACK: true,
    SIMULATE_API: false, // Set to false to use real World Bank API data
    USE_REAL_API: true // Enable real API data fetching
};

// Chart instances
let charts = {};
let isLoadingData = false;
let australiaMapInstance = null;

// Australia state data with coordinates and paths
const australiaStates = {
    'NSW': { name: 'New South Wales', color: '#3b82f6' },
    'VIC': { name: 'Victoria', color: '#10b981' },
    'QLD': { name: 'Queensland', color: '#f59e0b' },
    'WA': { name: 'Western Australia', color: '#8b5cf6' },
    'SA': { name: 'South Australia', color: '#ef4444' },
    'TAS': { name: 'Tasmania', color: '#06b6d4' },
    'ACT': { name: 'ACT', color: '#ec4899' },
    'NT': { name: 'NT', color: '#14b8a6' }
};

// Fetch real Australian economic data
async function fetchABSData() {
    try {
        showLoading(true);
        
        // Try multiple data sources
        let dataFetched = false;
        
        // Attempt 1: Fetch from World Bank API (real economic data)
        if (API_CONFIG.USE_REAL_API) {
            try {
                await fetchWorldBankData();
                dataFetched = true;
                showError(null);
                updateDataSourceBadge('World Bank Data');
            } catch (error) {
                console.warn('World Bank data fetch failed:', error);
            }
        }
        
        // Attempt 2: Try to fetch from public Australian datasets
        if (!dataFetched) {
            try {
                await fetchPublicAustralianData();
                dataFetched = true;
                showError(null);
                updateDataSourceBadge('Market Data');
            } catch (error) {
                console.warn('Market data source failed:', error);
            }
        }
        
        // Attempt 3: Use simulated API data (realistic variations)
        if (!dataFetched && API_CONFIG.SIMULATE_API) {
            simulateAPIDataUpdate();
            dataFetched = true;
            showError(null);
            updateDataSourceBadge('Simulated Data');
        }
        
        // Fallback to demo data
        if (!dataFetched) {
            if (API_CONFIG.USE_FALLBACK) {
                updateAllChartsWithCurrentData();
                showError('Using demo Australian business data.');
                updateDataSourceBadge('Demo Mode');
            } else {
                throw new Error('All data sources unavailable');
            }
        }
        
    } catch (error) {
        console.error('Error fetching data:', error);
        showError('Using local Australian business data. Check console for details.');
        updateDataSourceBadge('Demo Mode');
    } finally {
        showLoading(false);
    }
}

// Fetch real Australian economic data from World Bank API
async function fetchWorldBankData() {
    console.log('Fetching real data from World Bank API...');
    
    // World Bank Indicators for Australian economy
    const indicators = {
        gdp: 'NY.GDP.MKTP.CD',              // GDP (current US$)
        gdpGrowth: 'NY.GDP.MKTP.KD.ZG',     // GDP growth (annual %)
        unemployment: 'SL.UEM.TOTL.ZS',     // Unemployment, total (% of labor force)
        population: 'SP.POP.TOTL',          // Population, total
        exports: 'NE.EXP.GNFS.ZS',          // Exports of goods and services (% of GDP)
        imports: 'NE.IMP.GNFS.ZS',          // Imports of goods and services (% of GDP)
        inflation: 'FP.CPI.TOTL.ZG',        // Inflation, consumer prices (annual %)
        manufacturing: 'NV.IND.MANF.ZS'     // Manufacturing, value added (% of GDP)
    };
    
    const promises = Object.entries(indicators).map(async ([key, indicatorCode]) => {
        const url = `${API_CONFIG.WORLD_BANK_BASE}/country/${API_CONFIG.WORLD_BANK_COUNTRY}/indicator/${indicatorCode}?format=json&per_page=10&date=2015:2024`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch ${key}: ${response.status}`);
        }
        
        const data = await response.json();
        return { key, data: data[1] }; // data[0] is metadata, data[1] is actual data
    });
    
    const results = await Promise.all(promises);
    
    // Process the data and update charts
    processWorldBankData(results);
    
    console.log('World Bank data successfully fetched and processed');
}

// Process World Bank data and update chart data
function processWorldBankData(results) {
    const dataMap = {};
    
    // Convert results array to map for easier access
    results.forEach(({ key, data }) => {
        if (data && data.length > 0) {
            // Filter out null values and sort by year
            const validData = data.filter(d => d.value !== null).sort((a, b) => a.date - b.date);
            dataMap[key] = validData;
        }
    });
    
    console.log('Processed World Bank data:', dataMap);
    
    // Update quarterly growth with GDP data (last 5 years)
    if (dataMap.gdp && dataMap.gdp.length >= 5) {
        const recentGDP = dataMap.gdp.slice(-5);
        const years = recentGDP.map(d => d.date);
        const gdpValues = recentGDP.map(d => Math.round(d.value / 1e9)); // Convert to billions
        
        // Update quarterly labels and data
        australianData.quarters.labels = years.map(y => `Year ${y}`);
        australianData.quarters.revenue = gdpValues;
        
        // Calculate profit margin (simplified: 15% of GDP)
        australianData.quarters.profit = gdpValues.map(v => Math.round(v * 0.15));
    }
    
    // Update monthly data with GDP growth trend
    if (dataMap.gdpGrowth && dataMap.gdpGrowth.length > 0) {
        const latestGrowth = dataMap.gdpGrowth[0].value;
        const baseRevenue = 125;
        const growthFactor = 1 + (latestGrowth / 100);
        
        // Apply growth trend to monthly data
        australianData.monthly.revenue2024 = australianData.monthly.revenue2024.map((val, idx) => 
            Math.round(baseRevenue * growthFactor * (1 + idx * 0.02))
        );
        australianData.monthly.revenue2025 = australianData.monthly.revenue2025.map((val, idx) => 
            val !== null ? Math.round(baseRevenue * growthFactor * (1.25 + idx * 0.02)) : null
        );
    }
    
    // Update industry distribution based on real economic indicators
    if (dataMap.manufacturing || dataMap.exports) {
        const manufacturingPct = dataMap.manufacturing?.[0]?.value || 11;
        const exportsPct = dataMap.exports?.[0]?.value || 22;
        
        // Adjust industry percentages to reflect real data
        australianData.industries.values = [
            Math.round(exportsPct), // Mining & Resources (tied to exports)
            18, // Finance & Insurance
            15, // Healthcare
            12, // Retail Trade
            Math.round(manufacturingPct), // Manufacturing (real data)
            9,  // Construction
            8,  // Education
            5   // Tourism & Hospitality
        ];
    }
    
    // Update employment data based on unemployment rate
    if (dataMap.unemployment && dataMap.unemployment.length > 0) {
        const unemploymentRate = dataMap.unemployment[0].value;
        const employmentRate = 100 - unemploymentRate;
        const scaleFactor = employmentRate / 95; // Normalize around 95% employment
        
        // Adjust employment figures
        australianData.employment.values = australianData.employment.values.map(val => 
            Math.round(val * scaleFactor)
        );
    }
    
    // Update state revenue based on GDP distribution
    if (dataMap.gdp && dataMap.gdp.length > 0) {
        const totalGDP = dataMap.gdp[0].value;
        const stateDistribution = [0.31, 0.25, 0.18, 0.14, 0.08, 0.03, 0.06, 0.02]; // Approximate state GDP %
        
        australianData.states.revenue = stateDistribution.map(pct => 
            Math.round((totalGDP * pct) / 1e9 / 3) // Convert to billions, divide by 3 for scale
        );
    }
    
    // Update cities business data proportionally
    if (dataMap.population && dataMap.population.length > 0) {
        const totalPop = dataMap.population[0].value;
        const cityPopProportions = [0.21, 0.18, 0.12, 0.09, 0.06, 0.04, 0.035, 0.03, 0.02, 0.015];
        const businessPerCapita = 0.08; // Approximate businesses per capita
        
        australianData.cities.businesses = cityPopProportions.map(pct => 
            Math.round((totalPop * pct * businessPerCapita) / 1000)
        );
    }
    
    // Update all charts with the new real data
    updateAllChartsWithCurrentData();
    updateStats();
}

// Fetch from public Australian data sources
async function fetchPublicAustralianData() {
    try {
        // Try to fetch Australian stock market data as a proxy for business activity
        const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/^AXJO?interval=1mo&range=1y');
        
        if (response.ok) {
            const data = await response.json();
            if (data.chart && data.chart.result && data.chart.result[0]) {
                updateChartsFromMarketData(data.chart.result[0]);
                return true;
            }
        }
    } catch (error) {
        console.warn('Market data fetch failed:', error);
    }
    
    return false;
}

// Simulate realistic API data updates (with variations)
function simulateAPIDataUpdate() {
    // Generate realistic variations in the data
    const variation = () => 0.95 + Math.random() * 0.1; // ±5% variation
    
    // Update state revenues with slight variations
    australianData.states.revenue = australianData.states.revenue.map(val => 
        Math.round(val * variation())
    );
    
    // Update employment figures
    australianData.employment.values = australianData.employment.values.map(val => 
        Math.round(val * variation())
    );
    
    // Update quarterly data (growth trend)
    const lastRevenue = australianData.quarters.revenue[australianData.quarters.revenue.length - 1];
    const lastProfit = australianData.quarters.profit[australianData.quarters.profit.length - 1];
    
    australianData.quarters.revenue = australianData.quarters.revenue.map(val => 
        Math.round(val * variation())
    );
    australianData.quarters.profit = australianData.quarters.profit.map(val => 
        Math.round(val * variation())
    );
    
    // Update city business counts
    australianData.cities.businesses = australianData.cities.businesses.map(val => 
        Math.round(val * variation())
    );
    
    // Update all charts with new data
    updateAllChartsWithCurrentData();
}

// Update charts from market data
function updateChartsFromMarketData(marketData) {
    try {
        if (marketData.timestamp && marketData.indicators) {
            const timestamps = marketData.timestamp;
            const closes = marketData.indicators.quote[0].close;
            
            // Update quarterly data based on market trends
            if (closes.length >= 5) {
                const recentCloses = closes.slice(-5);
                const scaleFactor = 0.02; // Scale market data to business revenue
                
                australianData.quarters.revenue = recentCloses.map(close => 
                    Math.round(close * scaleFactor)
                );
            }
            
            updateAllChartsWithCurrentData();
        }
    } catch (error) {
        console.warn('Error processing market data:', error);
    }
}

// Update all charts with current data
function updateAllChartsWithCurrentData() {
    if (charts.stateRevenue) {
        charts.stateRevenue.data.datasets[0].data = australianData.states.revenue;
        charts.stateRevenue.update();
    }
    
    if (charts.employmentDoughnut) {
        charts.employmentDoughnut.data.datasets[0].data = australianData.employment.values;
        charts.employmentDoughnut.update();
    }
    
    if (charts.quarterlyGrowth) {
        charts.quarterlyGrowth.data.datasets[0].data = australianData.quarters.revenue;
        charts.quarterlyGrowth.data.datasets[1].data = australianData.quarters.profit;
        charts.quarterlyGrowth.update();
    }
    
    if (charts.citiesBar) {
        charts.citiesBar.data.datasets[0].data = australianData.cities.businesses;
        charts.citiesBar.update();
    }
    
    updateStats();
}

// Update employment data from API response
function updateEmploymentFromAPI(apiData) {
    try {
        const observations = apiData.data.dataSets[0].series;
        const structure = apiData.data.structure;
        
        // Extract latest employment figures
        let employmentValues = [];
        
        for (let key in observations) {
            const series = observations[key];
            if (series.observations) {
                const latestObs = Object.keys(series.observations).pop();
                if (latestObs && series.observations[latestObs][0]) {
                    employmentValues.push(series.observations[latestObs][0]);
                }
            }
        }

        // Update the employment chart data if we have values
        if (employmentValues.length >= 6) {
            australianData.employment.values = employmentValues.slice(0, 6);
            
            // Update the chart if it exists
            if (charts.employmentDoughnut) {
                charts.employmentDoughnut.data.datasets[0].data = australianData.employment.values;
                charts.employmentDoughnut.update();
            }
        }
    } catch (error) {
        console.warn('Error processing employment data:', error);
    }
}

// Update state revenue from API response
function updateStateRevenueFromAPI(apiData) {
    try {
        if (apiData.data && apiData.data.dataSets && apiData.data.dataSets[0]) {
            const observations = apiData.data.dataSets[0].series;
            let stateValues = [];

            for (let key in observations) {
                const series = observations[key];
                if (series.observations) {
                    const latestObs = Object.keys(series.observations).pop();
                    if (latestObs && series.observations[latestObs][0]) {
                        stateValues.push(series.observations[latestObs][0]);
                    }
                }
            }

            if (stateValues.length >= 8) {
                australianData.states.revenue = stateValues.slice(0, 8);
                
                if (charts.stateRevenue) {
                    charts.stateRevenue.data.datasets[0].data = australianData.states.revenue;
                    charts.stateRevenue.update();
                }
            }
        }
    } catch (error) {
        console.warn('Error processing state revenue data:', error);
    }
}
// Show/hide loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('active', show);
    }
    isLoadingData = show;
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        if (message) {
            errorElement.innerHTML = `<strong>ℹ️ Info:</strong> ${message}`;
            errorElement.classList.add('active');
            setTimeout(() => {
                errorElement.classList.remove('active');
            }, 6000);
        } else {
            errorElement.classList.remove('active');
        }
    }
}

// Update data source badge
function updateDataSourceBadge(text) {
    const badge = document.getElementById('dataSourceBadge');
    if (badge) {
        badge.textContent = 'Source API: ' + text;
        
        // Color coding for different modes
        if (text.includes('World Bank')) {
            badge.style.backgroundColor = '#10b981'; // Green for real API data
        } else if (text.includes('Market')) {
            badge.style.backgroundColor = '#3b82f6'; // Blue for market data
        } else if (text.includes('Demo')) {
            badge.style.backgroundColor = '#f59e0b'; // Orange for demo mode
        } else if (text.includes('Simulated')) {
            badge.style.backgroundColor = '#8b5cf6'; // Purple for simulated
        } else {
            badge.style.backgroundColor = '#6366f1'; // Default purple
        }
    }
}

// Initialize all charts
function initCharts() {
    // Get current theme colors
    const isDarkTheme = document.body.classList.contains('dark-theme');
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
    
    // Check if mobile device
    const isMobile = window.innerWidth <= 768;
    
    // State Revenue Chart (Bar Chart)
    const stateCtx = document.getElementById('stateRevenueChart').getContext('2d');
    charts.stateRevenue = new Chart(stateCtx, {
        type: 'bar',
        data: {
            labels: australianData.states.labels,
            datasets: [{
                label: 'Revenue (Million AUD)',
                data: australianData.states.revenue,
                backgroundColor: isDarkTheme ? 'rgba(96, 165, 250, 0.7)' : 'rgba(37, 99, 235, 0.7)',
                borderColor: isDarkTheme ? 'rgba(96, 165, 250, 1)' : 'rgba(37, 99, 235, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: isDarkTheme ? '#f1f5f9' : textColor,
                        font: {
                            size: isMobile ? 11 : 13,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDarkTheme ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDarkTheme ? '#f1f5f9' : textColor,
                    bodyColor: isDarkTheme ? '#f1f5f9' : textColor,
                    borderColor: gridColor,
                    borderWidth: 1,
                    titleFont: {
                        size: isMobile ? 12 : 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: isMobile ? 11 : 13
                    },
                    callbacks: {
                        label: function(context) {
                            return `Revenue: $${context.parsed.y}M AUD`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: isDarkTheme ? '#e2e8f0' : secondaryColor,
                        font: {
                            size: isMobile ? 10 : 12
                        },
                        callback: function(value) {
                            return '$' + value + 'M';
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: isDarkTheme ? '#e2e8f0' : secondaryColor,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });

    // Industry Pie Chart
    const industryCtx = document.getElementById('industryPieChart').getContext('2d');
    charts.industryPie = new Chart(industryCtx, {
        type: 'pie',
        data: {
            labels: australianData.industries.labels,
            datasets: [{
                data: australianData.industries.values,
                backgroundColor: australianData.industries.colors,
                borderWidth: 3,
                borderColor: isDarkTheme ? '#1e293b' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: isMobile ? 'bottom' : 'right',
                    labels: {
                        color: isDarkTheme ? '#f1f5f9' : textColor,
                        padding: isMobile ? 10 : 15,
                        font: {
                            size: isMobile ? 10 : 12,
                            weight: '600'
                        },
                        boxWidth: 15,
                        boxHeight: 15,
                        usePointStyle: false
                    }
                },
                tooltip: {
                    backgroundColor: isDarkTheme ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDarkTheme ? '#f1f5f9' : textColor,
                    bodyColor: isDarkTheme ? '#f1f5f9' : textColor,
                    borderColor: gridColor,
                    borderWidth: 1,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });

    // Quarterly Growth Chart (Line Chart)
    const quarterlyCtx = document.getElementById('quarterlyGrowthChart').getContext('2d');
    charts.quarterlyGrowth = new Chart(quarterlyCtx, {
        type: 'line',
        data: {
            labels: australianData.quarters.labels,
            datasets: [{
                label: 'Revenue',
                data: australianData.quarters.revenue,
                borderColor: isDarkTheme ? 'rgba(96, 165, 250, 1)' : 'rgba(37, 99, 235, 1)',
                backgroundColor: isDarkTheme ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: isDarkTheme ? 'rgba(96, 165, 250, 1)' : 'rgba(37, 99, 235, 1)',
                pointBorderColor: isDarkTheme ? '#1e293b' : '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }, {
                label: 'Profit',
                data: australianData.quarters.profit,
                borderColor: isDarkTheme ? 'rgba(52, 211, 153, 1)' : 'rgba(16, 185, 129, 1)',
                backgroundColor: isDarkTheme ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: isDarkTheme ? 'rgba(52, 211, 153, 1)' : 'rgba(16, 185, 129, 1)',
                pointBorderColor: isDarkTheme ? '#1e293b' : '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: isDarkTheme ? '#f1f5f9' : textColor,
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDarkTheme ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDarkTheme ? '#f1f5f9' : textColor,
                    bodyColor: isDarkTheme ? '#f1f5f9' : textColor,
                    borderColor: gridColor,
                    borderWidth: 1,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y + 'M AUD';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: isDarkTheme ? '#e2e8f0' : secondaryColor,
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            return '$' + value + 'M';
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: isDarkTheme ? '#e2e8f0' : secondaryColor,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });

    // Employment Doughnut Chart
    const employmentCtx = document.getElementById('employmentDoughnutChart').getContext('2d');
    charts.employmentDoughnut = new Chart(employmentCtx, {
        type: 'doughnut',
        data: {
            labels: australianData.employment.labels,
            datasets: [{
                data: australianData.employment.values,
                backgroundColor: australianData.employment.colors,
                borderWidth: 3,
                borderColor: isDarkTheme ? '#1e293b' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: isMobile ? 'bottom' : 'right',
                    labels: {
                        color: isDarkTheme ? '#f1f5f9' : textColor,
                        padding: isMobile ? 10 : 15,
                        font: {
                            size: isMobile ? 10 : 12,
                            weight: '600'
                        },
                        boxWidth: 15,
                        boxHeight: 15,
                        usePointStyle: false
                    }
                },
                tooltip: {
                    backgroundColor: isDarkTheme ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDarkTheme ? '#f1f5f9' : textColor,
                    bodyColor: isDarkTheme ? '#f1f5f9' : textColor,
                    borderColor: gridColor,
                    borderWidth: 1,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed.toLocaleString() + ' employees';
                        }
                    }
                }
            }
        }
    });

    // Monthly Performance Chart (Multi-line)
    const monthlyCtx = document.getElementById('monthlyPerformanceChart').getContext('2d');
    charts.monthlyPerformance = new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: australianData.monthly.labels,
            datasets: [{
                label: '2024',
                data: australianData.monthly.revenue2024,
                borderColor: isDarkTheme ? 'rgba(167, 139, 250, 1)' : 'rgba(139, 92, 246, 1)',
                backgroundColor: isDarkTheme ? 'rgba(167, 139, 250, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: isDarkTheme ? 'rgba(167, 139, 250, 1)' : 'rgba(139, 92, 246, 1)',
                pointBorderColor: isDarkTheme ? '#1e293b' : '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }, {
                label: '2025',
                data: australianData.monthly.revenue2025,
                borderColor: isDarkTheme ? 'rgba(52, 211, 153, 1)' : 'rgba(16, 185, 129, 1)',
                backgroundColor: isDarkTheme ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: isDarkTheme ? 'rgba(52, 211, 153, 1)' : 'rgba(16, 185, 129, 1)',
                pointBorderColor: isDarkTheme ? '#1e293b' : '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderDash: [5, 5]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: isDarkTheme ? '#f1f5f9' : textColor,
                        font: {
                            size: 13,
                            weight: '600'
                        },
                        padding: 10,
                        boxWidth: 40,
                        boxHeight: 3
                    }
                },
                tooltip: {
                    backgroundColor: isDarkTheme ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDarkTheme ? '#f1f5f9' : textColor,
                    bodyColor: isDarkTheme ? '#f1f5f9' : textColor,
                    borderColor: gridColor,
                    borderWidth: 1,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y + 'M AUD';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: isDarkTheme ? '#e2e8f0' : secondaryColor,
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            return '$' + value + 'M';
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: isDarkTheme ? '#e2e8f0' : secondaryColor,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });

    // Cities Bar Chart (Horizontal)
    const citiesCtx = document.getElementById('citiesBarChart').getContext('2d');
    charts.citiesBar = new Chart(citiesCtx, {
        type: 'bar',
        data: {
            labels: australianData.cities.labels,
            datasets: [{
                label: 'Number of Businesses',
                data: australianData.cities.businesses,
                backgroundColor: australianData.cities.colors,
                borderColor: australianData.cities.colors.map(color => color),
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: isDarkTheme ? '#f1f5f9' : textColor,
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDarkTheme ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDarkTheme ? '#f1f5f9' : textColor,
                    bodyColor: isDarkTheme ? '#f1f5f9' : textColor,
                    borderColor: gridColor,
                    borderWidth: 1,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return 'Businesses: ' + context.parsed.x.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: isDarkTheme ? '#e2e8f0' : secondaryColor,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    ticks: {
                        color: isDarkTheme ? '#e2e8f0' : secondaryColor,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });

    updateStats();
}

// Initialize Australia Map
function initAustraliaMap() {
    const mapContainer = document.getElementById('australiaMap');
    if (!mapContainer) return;
    
    const isDarkTheme = document.body.classList.contains('dark-theme');
    
    // Create SVG map of Australia (simplified version)
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 1000 700");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'map-tooltip';
    mapContainer.appendChild(tooltip);
    
    // Accurate Australian state paths based on real map
    const statePaths = {
        'WA': 'M 50,100 L 50,200 L 30,250 L 35,320 L 50,380 L 45,420 L 55,460 L 80,500 L 120,530 L 180,550 L 240,560 L 280,550 L 320,530 L 340,500 L 345,460 L 340,420 L 345,380 L 340,340 L 340,300 L 335,260 L 340,220 L 340,180 L 340,140 L 340,100 L 320,80 L 280,60 L 240,40 L 200,30 L 160,25 L 120,30 L 80,50 Z',
        'NT': 'M 340,20 L 340,100 L 340,140 L 340,180 L 340,220 L 335,260 L 340,300 L 340,340 L 340,350 L 480,350 L 490,340 L 500,300 L 510,260 L 520,220 L 520,180 L 515,140 L 505,100 L 490,60 L 470,40 L 450,25 L 420,15 L 390,10 L 360,15 Z',
        'SA': 'M 340,350 L 340,380 L 345,420 L 340,460 L 345,500 L 340,530 L 350,560 L 380,580 L 420,590 L 460,590 L 500,585 L 540,575 L 570,560 L 575,530 L 570,500 L 560,470 L 550,440 L 540,410 L 530,380 L 520,360 L 500,350 L 480,350 Z',
        'QLD': 'M 480,20 L 500,30 L 520,50 L 540,80 L 560,110 L 580,150 L 600,190 L 620,230 L 640,270 L 660,310 L 680,340 L 700,365 L 720,385 L 740,400 L 760,410 L 780,415 L 800,410 L 815,395 L 825,375 L 830,350 L 828,320 L 820,290 L 810,260 L 795,230 L 780,200 L 760,170 L 740,145 L 720,120 L 700,95 L 680,75 L 660,60 L 640,48 L 620,40 L 600,35 L 580,32 L 560,30 L 540,28 L 520,26 L 500,24 Z',
        'NSW': 'M 560,410 L 580,430 L 600,450 L 620,465 L 640,480 L 660,492 L 680,500 L 700,505 L 720,508 L 740,508 L 760,505 L 780,498 L 795,488 L 808,475 L 815,460 L 820,445 L 822,430 L 820,415 L 810,400 L 795,388 L 780,380 L 760,375 L 740,372 L 720,372 L 700,375 L 680,380 L 660,388 L 640,398 L 620,408 L 600,415 L 580,418 Z',
        'VIC': 'M 540,575 L 560,585 L 580,592 L 600,597 L 620,600 L 640,602 L 660,602 L 680,600 L 700,597 L 720,592 L 740,585 L 760,577 L 778,567 L 792,555 L 800,542 L 802,528 L 798,515 L 788,505 L 775,498 L 760,493 L 745,490 L 730,489 L 715,490 L 700,492 L 685,496 L 670,502 L 655,510 L 640,520 L 625,532 L 610,545 L 595,558 L 580,568 L 565,575 Z',
        'TAS': 'M 660,640 L 680,650 L 700,656 L 720,658 L 740,656 L 760,650 L 775,642 L 785,632 L 790,620 L 788,608 L 780,598 L 768,590 L 752,586 L 736,584 L 720,584 L 704,586 L 688,590 L 675,596 L 665,604 L 658,614 L 655,625 Z',
        'ACT': 'M 760,475 L 772,482 L 780,478 L 785,470 L 782,462 L 772,458 L 763,462 Z'
    };
    
    // Get revenue data for each state
    const stateRevenues = {};
    australianData.states.labels.forEach((label, index) => {
        const stateCode = Object.keys(australiaStates).find(code => 
            australiaStates[code].name === label
        );
        if (stateCode) {
            stateRevenues[stateCode] = australianData.states.revenue[index];
        }
    });
    
    // Function to get color based on revenue
    const getStateColor = (revenue) => {
        if (revenue >= 400) return isDarkTheme ? '#1e40af' : '#1e40af';
        if (revenue >= 250) return isDarkTheme ? '#3b82f6' : '#3b82f6';
        if (revenue >= 100) return isDarkTheme ? '#93c5fd' : '#93c5fd';
        return isDarkTheme ? '#dbeafe' : '#eff6ff';
    };
    
    // Create state paths
    Object.keys(statePaths).forEach(stateCode => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", statePaths[stateCode]);
        path.setAttribute("class", "state-path");
        path.setAttribute("data-state", stateCode);
        
        const revenue = stateRevenues[stateCode] || 0;
        path.setAttribute("fill", getStateColor(revenue));
        
        // Add hover effects
        path.addEventListener('mouseenter', (e) => {
            const stateName = australiaStates[stateCode].name;
            const businesses = australianData.states.businesses[
                australianData.states.labels.indexOf(stateName)
            ];
            
            tooltip.innerHTML = `
                <h4>${stateName}</h4>
                <p>Revenue: <span class="tooltip-value">$${revenue}M AUD</span></p>
                <p>Businesses: <span class="tooltip-value">${businesses ? businesses.toLocaleString() : 'N/A'}</span></p>
            `;
            tooltip.classList.add('active');
            path.classList.add('active');
        });
        
        path.addEventListener('mousemove', (e) => {
            const rect = mapContainer.getBoundingClientRect();
            tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
            tooltip.style.top = (e.clientY - rect.top - 15) + 'px';
        });
        
        path.addEventListener('mouseleave', () => {
            tooltip.classList.remove('active');
            path.classList.remove('active');
        });
        
        path.addEventListener('click', () => {
            highlightState(stateCode);
        });
        
        svg.appendChild(path);
    });
    
    // Add state labels with better positioning based on actual map
    const labelPositions = {
        'WA': [190, 280],
        'NT': [430, 180],
        'SA': [440, 470],
        'QLD': [680, 220],
        'NSW': [720, 460],
        'VIC': [700, 560],
        'TAS': [720, 625],
        'ACT': [775, 470]
    };
    
    Object.keys(labelPositions).forEach(stateCode => {
        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", labelPositions[stateCode][0]);
        text.setAttribute("y", labelPositions[stateCode][1]);
        text.setAttribute("class", "state-label");
        text.setAttribute("text-anchor", "middle");
        text.textContent = stateCode;
        svg.appendChild(text);
    });
    
    mapContainer.innerHTML = '';
    mapContainer.appendChild(svg);
    mapContainer.appendChild(tooltip);
    
    australiaMapInstance = { svg, tooltip };
}

// Highlight state on map
function highlightState(stateCode) {
    const stateName = australiaStates[stateCode].name;
    console.log(`Selected state: ${stateName}`);
    
    // Visual feedback for state selection
    const allPaths = document.querySelectorAll('.state-path');
    allPaths.forEach(path => {
        if (path.getAttribute('data-state') === stateCode) {
            path.style.strokeWidth = '4';
            path.style.stroke = '#10b981';
        } else {
            path.style.strokeWidth = '2';
        }
    });
}

// Update statistics cards
function updateStats() {
    const totalRevenue = australianData.states.revenue.reduce((a, b) => a + b, 0);
    const totalBusinesses = australianData.states.businesses.reduce((a, b) => a + b, 0);
    const totalEmployees = australianData.employment.values.reduce((a, b) => a + b, 0);
    const growthRate = ((australianData.quarters.revenue[4] - australianData.quarters.revenue[0]) / australianData.quarters.revenue[0] * 100).toFixed(1);


    document.getElementById('totalRevenue').textContent = '$' + totalRevenue + 'M';
    document.getElementById('totalBusinesses').textContent = totalBusinesses.toLocaleString();
    document.getElementById('totalEmployees').textContent = totalEmployees.toLocaleString();
    document.getElementById('growthRate').textContent = '+' + growthRate + '%';
}

// Update charts with animation
function updateCharts() {
    if (isLoadingData) return;
    
    // Fetch fresh data from API
    fetchABSData().then(() => {
        Object.values(charts).forEach(chart => {
            chart.update('active');
        });
        
        updateStats();
    });
    
    // Add visual feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Refreshing...';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
    }, 2000);
}

// Toggle theme
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    
    // Destroy all existing charts
    Object.values(charts).forEach(chart => {
        chart.destroy();
    });
    
    // Reinitialize charts with new theme
    initCharts();
    initAustraliaMap();
    
    // Refresh data
    updateAllChartsWithCurrentData();
}

// Export dashboard to PDF
async function exportToPDF() {
    try {
        // Show loading
        showLoading(true);
        
        // Store current theme state
        const isDarkMode = document.body.classList.contains('dark-theme');
        
        // Temporarily switch to light theme for PDF
        if (isDarkMode) {
            document.body.classList.remove('dark-theme');
            
            // Update all charts to light theme
            Object.values(charts).forEach(chart => {
                chart.destroy();
            });
            initCharts();
            updateAllChartsWithCurrentData();
            
            // Wait for charts to render
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Get jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // PDF dimensions
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        
        // Add header
        pdf.setFillColor(37, 99, 235);
        pdf.rect(0, 0, pageWidth, 35, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(22);
        pdf.setFont(undefined, 'bold');
        pdf.text('Australian Business Analytics', margin, 15);
        
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        pdf.text('Interactive Data Visualization Dashboard', margin, 23);
        
        // Add date
        const today = new Date().toLocaleDateString('en-AU', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        pdf.setFontSize(10);
        pdf.text('Generated: ' + today, margin, 30);
        
        let yPosition = 45;
        
        // Add statistics summary
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Key Metrics Summary', margin, yPosition);
        yPosition += 10;
        
        // Get current stats
        const totalRevenue = australianData.states.revenue.reduce((a, b) => a + b, 0);
        const totalBusinesses = australianData.states.businesses.reduce((a, b) => a + b, 0);
        const totalEmployees = australianData.employment.values.reduce((a, b) => a + b, 0);
        const growthRate = ((australianData.quarters.revenue[4] - australianData.quarters.revenue[0]) / australianData.quarters.revenue[0] * 100).toFixed(1);
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text('Total Revenue: $' + totalRevenue + 'M AUD', margin + 5, yPosition);
        yPosition += 6;
        pdf.text('Active Businesses: ' + totalBusinesses.toLocaleString(), margin + 5, yPosition);
        yPosition += 6;
        pdf.text('Total Employees: ' + totalEmployees.toLocaleString(), margin + 5, yPosition);
        yPosition += 6;
        pdf.text('YoY Growth Rate: +' + growthRate + '%', margin + 5, yPosition);
        yPosition += 12;
        
        // Function to add chart to PDF with compression
        const addChartToPDF = async (chartId, title, yPos) => {
            const canvas = document.getElementById(chartId);
            if (!canvas) return yPos;
            
            // Check if we need a new page
            if (yPos > pageHeight - 90) {
                pdf.addPage();
                yPos = margin;
            }
            
            // Add chart title
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.text(title, margin, yPos);
            yPos += 8;
            
            // Calculate proper aspect ratio
            const canvasAspectRatio = canvas.width / canvas.height;
            const maxWidth = contentWidth;
            const maxHeight = 80;
            
            let chartWidth = maxWidth;
            let chartHeight = chartWidth / canvasAspectRatio;
            
            // If height exceeds max, scale down
            if (chartHeight > maxHeight) {
                chartHeight = maxHeight;
                chartWidth = chartHeight * canvasAspectRatio;
            }
            
            // Create high-resolution canvas for PDF export
            const scale = 2.5; // 2.5x scale for sharper images
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width * scale;
            tempCanvas.height = canvas.height * scale;
            
            const ctx = tempCanvas.getContext('2d');
            
            // Fill with white background first (fixes black background issue)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Enable better image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw chart on top of white background
            ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
            
            // Use JPEG with higher quality (90% for better clarity)
            const imgData = tempCanvas.toDataURL('image/jpeg', 0.90);
            
            // Center the image if it's smaller than maxWidth
            const xOffset = margin + (maxWidth - chartWidth) / 2;
            
            pdf.addImage(imgData, 'JPEG', xOffset, yPos, chartWidth, chartHeight);
            yPos += chartHeight + 12;
            
            return yPos;
        };
        
        // Add all charts
        yPosition = await addChartToPDF('stateRevenueChart', 'Revenue by Australian State', yPosition);
        yPosition = await addChartToPDF('industryPieChart', 'Industry Distribution', yPosition);
        
        // New page for remaining charts
        pdf.addPage();
        yPosition = margin;
        
        yPosition = await addChartToPDF('quarterlyGrowthChart', 'Quarterly Growth Trends (2024-2025)', yPosition);
        yPosition = await addChartToPDF('employmentDoughnutChart', 'Employment by Sector', yPosition);
        
        // New page for final charts
        pdf.addPage();
        yPosition = margin;
        
        yPosition = await addChartToPDF('monthlyPerformanceChart', 'Monthly Business Performance', yPosition);
        yPosition = await addChartToPDF('citiesBarChart', 'Top Australian Cities by Business Activity', yPosition);
        
        // Add footer to all pages
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(128, 128, 128);
            pdf.text(
                'Australian Business Analytics Dashboard | Page ' + i + ' of ' + pageCount,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }
        
        // Save PDF
        const fileName = 'Australian-Business-Analytics-' + new Date().toISOString().split('T')[0] + '.pdf';
        pdf.save(fileName);
        
        // Restore dark theme if it was active
        if (isDarkMode) {
            document.body.classList.add('dark-theme');
            
            // Restore dark theme charts
            Object.values(charts).forEach(chart => {
                chart.destroy();
            });
            initCharts();
            updateAllChartsWithCurrentData();
        }
        
        // Show success message
        showError('PDF exported successfully! File size optimized.');
        
    } catch (error) {
        console.error('PDF export error:', error);
        showError('Failed to export PDF. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Initialize on page load
window.addEventListener('load', () => {
    initCharts();
    initAustraliaMap();
    
    // Show "Loading..." for 2 seconds before fetching API data
    updateDataSourceBadge('Loading...');
    setTimeout(() => {
        fetchABSData();
    }, 2000);
});

// Handle window resize
window.addEventListener('resize', () => {
    const wasResized = true;
    Object.values(charts).forEach(chart => {
        chart.resize();
    });
    
    // Reinitialize charts on mobile/desktop switch
    const currentWidth = window.innerWidth;
    if ((currentWidth <= 768 && !window.isMobileView) || (currentWidth > 768 && window.isMobileView)) {
        window.isMobileView = currentWidth <= 768;
        
        // Destroy and recreate charts with appropriate settings
        Object.values(charts).forEach(chart => {
            chart.destroy();
        });
        initCharts();
        updateAllChartsWithCurrentData();
    }
});
