# ShopMate POS - Deployment Checklist

## Pre-Deployment

- [ ] HTTPS enabled (required for PWA)
- [ ] manifest.json present and valid
- [ ] sw.js present and valid
- [ ] Icons (192x192, 512x512) in /icons folder
- [ ] All file paths relative (not absolute)

## Testing Matrix

### Devices
- [ ] Samsung Galaxy (Android 10+)
- [ ] Tecno/Itel (Android 8+)
- [ ] Huawei (Android 9+)
- [ ] Xiaomi (Android 10+)
- [ ] Tablet (any brand)
- [ ] Low-end device (2GB RAM)

### Browsers
- [ ] Chrome Android
- [ ] Samsung Internet
- [ ] Edge Android
- [ ] Firefox Android
- [ ] Android WebView

### Scenarios
- [ ] Fresh install
- [ ] Offline operation
- [ ] Update after network return
- [ ] Storage full scenario
- [ ] App kill and restore
- [ ] Background/foreground switch

## Installation Instructions for Clients

### Chrome/Edge:
1. Open app in browser
2. Tap menu (⋮)
3. Select "Install app" or "Add to Home Screen"
4. Tap "Add"

### Samsung Internet:
1. Open app in browser
2. Tap menu (≡)
3. Select "Add page to"
4. Select "Home screen"
5. Tap "Add"

### Manual (any browser):
1. Open app in browser
2. Tap menu
3. Select "Add to Home Screen"
4. Confirm

## Troubleshooting

### App won't install:
- Check HTTPS is enabled
- Clear browser cache
- Try different browser
- Check manifest.json validity

### Offline not working:
- Wait 30 seconds after first load
- Clear service worker cache
- Reload page
- Check console for errors

### Storage full:
- Export backups
- Clear old transactions
- Reinstall app