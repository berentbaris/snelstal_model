# Snelstal Ammonia Emission Model — Web Application

A web-based replica of the AmmoniakEmissie Model V2.0 (Monteny, 1998), originally developed at Wageningen University (Farm Technology Group).

## Quick start

Open `index.html` in any modern browser. No server or build step required.

## Deploy to GitHub Pages

1. Push this folder (`snelstal_model/`) to a GitHub repository
2. Go to **Settings > Pages**
3. Set source to the branch and folder containing `index.html`
4. The app will be live at `https://<username>.github.io/<repo>/`

## Features

- All calculations run client-side in JavaScript (no server needed)
- Language toggle: Dutch / English (matching the original GTK interface labels)
- Default pit / Specific pit mode (matching the English `.glade` toggle)
- Monte Carlo simulation with configurable number of runs
- Results match the original `emissie.exe` within <1%

## File structure

```
snelstal_model/
├── index.html          # Main page
├── css/
│   └── style.css       # Styling
├── js/
│   ├── model.js        # Pure calculation engine (no UI)
│   ├── translations.js # NL/EN string dictionaries
│   └── app.js          # UI logic, event handlers
└── README.md           # This file
```

## Credits

Based on Snelstal (Monteny, 1998) — Farm Technology Group, Wageningen University & Research.
