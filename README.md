# Jasiek 'Kurewiusz' Zając - Interaktywna Gra Przygodowa

Cyniczny, wulgarny i sadystyczny mistrz gry prowadzi cię przez mroczne przygody Jaśka Zająca, znanego także jako Kurewiusz. Każda decyzja prowadzi do jeszcze bardziej spierdolonej sytuacji.

## Funkcje

- **Interaktywna narracja**: Dynamicznie generowana historia oparta na twoich wyborach
- **AI-powered**: Wykorzystuje Google Gemini API do generowania treści
- **Tryb offline**: Bez klucza API aplikacja przełącza się na wulgarną improwizację lokalnego generatora
- **Responsywny design**: Działa na wszystkich urządzeniach
- **Mroczny humor**: Pełen wulgarnego polskiego humoru
- **Autosejw i eksport**: Gra zapamiętuje ostatnią sesję i pozwala kopiować lub pobrać log z przygodą

## Wymagania

- Node.js (wersja 18 lub nowsza)
- Klucz API Google Gemini (opcjonalnie, aby korzystać z prawdziwego modelu)

## Instalacja i uruchomienie

1. **Sklonuj repozytorium:**
   ```bash
   git clone <repository-url>
   cd zajac
   ```

2. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

3. **Skonfiguruj zmienne środowiskowe:**
   ```bash
   cp .env.example .env
   ```
   Następnie edytuj plik `.env` i wpisz swój klucz API Google Gemini:
   ```
   GEMINI_API_KEY=twój_klucz_api_tutaj
   ```
   
   Klucz możesz otrzymać na: https://aistudio.google.com/app/apikey

4. **Uruchom aplikację:**
   ```bash
   npm run dev
   ```

5. **Otwórz w przeglądarce:**
   ```
   http://localhost:3000
   ```

## Budowanie dla produkcji

```bash
npm run build
npm run preview
```

## Struktura projektu

```
src/
├── components/          # Komponenty React
│   ├── Header.tsx      # Nagłówek aplikacji
│   ├── StoryWindow.tsx # Okno z historią
│   ├── ChoiceBox.tsx   # Przyciski wyboru
│   └── LoadingSpinner.tsx # Spinner ładowania
├── services/           # Usługi
│   └── geminiService.ts # Komunikacja z API
├── types.ts           # Definicje typów
└── App.tsx           # Główny komponent
```

## Technologie

- **React 19**: Biblioteka UI
- **TypeScript**: Typowanie
- **Vite**: Build tool
- **Tailwind CSS**: Stylowanie
- **Google Gemini API**: Generowanie treści

## Rozwiązywanie problemów

### Błąd API Key
Jeśli otrzymujesz błędy związane z kluczem API:
1. Sprawdź czy plik `.env` istnieje i zawiera prawidłowy klucz
2. Upewnij się że klucz zaczyna się od odpowiedniego prefiksu
3. Sprawdź czy masz aktywne API w Google AI Studio

### Brak internetu lub odpowiedzi z Gemini
Gdy nie można połączyć się z modelem, aplikacja działa w trybie awaryjnej improwizacji:
1. Na ekranie pojawią się komunikaty o trybie offline zamiast błędu krytycznego
2. Wciąż możesz grać i zapisywać przebieg, ale treści generuje lokalny generator
3. Po powrocie połączenia i odświeżeniu strony historia znów może być tworzona przez Gemini

### Problemy z budowaniem
Jeśli wystąpią problemy z kompilacją:
```bash
rm -rf node_modules
npm install
npm run build
```
