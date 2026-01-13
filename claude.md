# Hearo

React Native (Expo) ile yazılmış kulak eğitimi uygulaması.

## Tech Stack
- React Native + Expo SDK 54
- TypeScript
- expo-av (ses playback)
- @react-navigation/native-stack

## Yapı
```
src/
├── core/          # Teori ve ses modülleri (claude.md var)
├── screens/       # Ekranlar (claude.md var)
├── components/    # UI bileşenleri (claude.md var)
└── theme.ts       # Renkler, spacing, fontSize
```

## Ses Dosyaları
`assets/sounds/piano/` - 36 piano sample (C3-B5), ~720KB toplam

## Çalıştırma
```bash
npx expo start
```
