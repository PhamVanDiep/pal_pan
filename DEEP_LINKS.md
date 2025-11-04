# Deep Links Guide - Pal Pan App

## Supported Deep Links

### Custom URL Scheme (pal-pan://)

#### Main Tabs
- `pal-pan://home` - Mở tab Công Việc
- `pal-pan://calendar` - Mở tab Lịch
- `pal-pan://files` - Mở tab Files
- `pal-pan://settings` - Mở tab Cài Đặt

#### Files Section
- `pal-pan://files/pdf` - Mở PDF Manager
- `pal-pan://files/images` - Mở Image Gallery

#### Settings Section
- `pal-pan://settings/profile` - Mở Profile
- `pal-pan://settings/device-info` - Mở Device Info

### Universal Links / App Links (https://)

Replace `pal-pan://` with `https://pal-pan.app/` hoặc `https://www.pal-pan.app/`

Ví dụ:
- `https://pal-pan.app/home`
- `https://pal-pan.app/files/pdf`
- `https://pal-pan.app/settings/profile`

## Testing Deep Links

### Android

#### Method 1: ADB Command (Recommended)
```bash
# Test custom scheme
adb shell am start -W -a android.intent.action.VIEW -d "pal-pan://home" com.pal_pan

# Test specific screens
adb shell am start -W -a android.intent.action.VIEW -d "pal-pan://calendar" com.pal_pan
adb shell am start -W -a android.intent.action.VIEW -d "pal-pan://files/pdf" com.pal_pan
adb shell am start -W -a android.intent.action.VIEW -d "pal-pan://files/images" com.pal_pan
adb shell am start -W -a android.intent.action.VIEW -d "pal-pan://settings" com.pal_pan
adb shell am start -W -a android.intent.action.VIEW -d "pal-pan://settings/device-info" com.pal_pan

# Test universal links
adb shell am start -W -a android.intent.action.VIEW -d "https://pal-pan.app/home" com.pal_pan
```

#### Method 2: Browser/WebView
1. Mở Chrome trên emulator/device
2. Nhập URL vào address bar: `pal-pan://home`
3. Nhấn Enter
4. Chọn "Open with Pal Pan"

#### Method 3: HTML Test File
1. Tạo file `test.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Pal Pan Deep Link Test</title>
</head>
<body>
    <h1>Pal Pan Deep Link Test</h1>
    <ul>
        <li><a href="pal-pan://home">Home</a></li>
        <li><a href="pal-pan://calendar">Calendar</a></li>
        <li><a href="pal-pan://files/pdf">PDF Manager</a></li>
        <li><a href="pal-pan://files/images">Image Gallery</a></li>
        <li><a href="pal-pan://settings">Settings</a></li>
        <li><a href="pal-pan://settings/device-info">Device Info</a></li>
    </ul>
</body>
</html>
```
2. Push file lên device:
```bash
adb push test.html /sdcard/Download/test.html
```
3. Mở file bằng Chrome và click vào links

### iOS

#### Method 1: Safari
1. Mở Safari
2. Nhập URL: `pal-pan://home`
3. Tap "Open" khi được hỏi

#### Method 2: xcrun simctl (Simulator)
```bash
# Launch simulator first
xcrun simctl boot "iPhone 15"

# Test deep links
xcrun simctl openurl booted "pal-pan://home"
xcrun simctl openurl booted "pal-pan://calendar"
xcrun simctl openurl booted "pal-pan://files/pdf"
xcrun simctl openurl booted "https://pal-pan.app/settings"
```

#### Method 3: Terminal (Physical Device)
```bash
xcrun devicectl device open url --device <device-id> "pal-pan://home"
```

## Testing from Another App

### Android - Create Test App
```java
// In your test app
Intent intent = new Intent(Intent.ACTION_VIEW,
    Uri.parse("pal-pan://files/pdf"));
startActivity(intent);
```

### iOS - Create Test App
```swift
// In your test app
if let url = URL(string: "pal-pan://files/pdf") {
    UIApplication.shared.open(url)
}
```

## Debugging

### Android
```bash
# Monitor logcat for deep link handling
adb logcat | grep -i "intent\|uri\|link"

# Check if intent filters are properly registered
adb shell dumpsys package com.pal_pan | grep -A 10 "android.intent.action.VIEW"
```

### iOS
Check Xcode console when opening deep links to see navigation events.

## Production Setup

### Universal Links (iOS)

1. Host `apple-app-site-association` file at:
   - `https://pal-pan.app/.well-known/apple-app-site-association`
   - `https://www.pal-pan.app/.well-known/apple-app-site-association`

Example file content:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.palpan",
        "paths": ["*"]
      }
    ]
  }
}
```

2. Enable "Associated Domains" in Xcode:
   - Add domain: `applinks:pal-pan.app`
   - Add domain: `applinks:www.pal-pan.app`

### App Links (Android)

1. Host `assetlinks.json` file at:
   - `https://pal-pan.app/.well-known/assetlinks.json`
   - `https://www.pal-pan.app/.well-known/assetlinks.json`

Example file content:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.pal_pan",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

2. Get SHA256 fingerprint:
```bash
# Debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release keystore
keytool -list -v -keystore /path/to/release.keystore -alias your-alias
```

## Common Issues

### Android

**Issue**: Deep link không mở app
- **Solution**: Check manifest có `android:exported="true"` trong Activity
- **Solution**: Uninstall và reinstall app để refresh intent filters

**Issue**: App Links không verify
- **Solution**: Check assetlinks.json accessible qua HTTPS
- **Solution**: Verify SHA256 fingerprint matches

### iOS

**Issue**: Deep link không hoạt động
- **Solution**: Check Info.plist có CFBundleURLTypes
- **Solution**: Clean build folder (Cmd+Shift+K)

**Issue**: Universal Links không hoạt động
- **Solution**: Check apple-app-site-association file
- **Solution**: Check Associated Domains trong Xcode

## Notes

- Deep links chỉ hoạt động khi app đã được cài đặt
- Universal/App Links hoạt động cả khi app chưa cài (redirect to App Store/Play Store)
- Cần phải đăng nhập trước khi navigate đến các screen bên trong
- Test trên real device để đảm bảo hoạt động chính xác
