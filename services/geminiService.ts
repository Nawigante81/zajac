import { GoogleGenAI, Type } from "@google/genai";
import { StorySegment, LogEntry } from "../types";

const resolveApiKey = (): string | null => {
  const processKey =
    typeof process !== "undefined"
      ? process.env?.GEMINI_API_KEY ?? process.env?.API_KEY ?? null
      : null;

  if (processKey) {
    return processKey;
  }

  const metaEnv =
    typeof import.meta !== "undefined"
      ? (import.meta as ImportMeta & {
          env?: Record<string, string | undefined>;
        }).env
      : undefined;

  if (!metaEnv) {
    return null;
  }

  return metaEnv.VITE_GEMINI_API_KEY ?? metaEnv.VITE_API_KEY ?? null;
};

let cachedClient: GoogleGenAI | null = null;
let missingKeyWarned = false;

const getClient = () => {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = resolveApiKey();

  if (!apiKey) {
    if (!missingKeyWarned && typeof console !== "undefined") {
      console.warn(
        "Nie ustawiono klucza GEMINI_API_KEY. Aplikacja przechodzi w tryb offline."
      );
      missingKeyWarned = true;
    }
    return null;
  }

  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
};
const modelName = "gemini-2.5-flash";

// Uwaga: Treść systemowa zawiera wulgarne frazy z istniejącego projektu — pozostawiamy bez zmian funkcjonalnych.
const systemInstruction = `Jesteś cynicznym, wulgarnym i sadystycznym mistrzem gry w stylu retro RPG. Twoim zadaniem jest opowiadanie interaktywnej historii o gościu imieniem Jasiek, znanym szerzej jako Zając lub po prostu Kurewiusz. Jasiek to totalny dupek, skurwysyn i pechowiec. Zwracaj się do gracza per 'ty' i nie szczędź mu obelg. Używaj barwnego, kreatywnie wulgarnego języka polskiego. Każda twoja odpowiedź musi być wyłącznie w formacie JSON zgodnym z podanym schematem. JSON powinien zawierać dwa pola: 'story' (krótki, 2-3 zdaniowy fragment historii opisujący popierdoloną sytuację Jaśka) oraz 'choices' (tablica z 3 zwięzłymi, jedno- lub dwuwyrazowymi opcjami wyboru dla gracza, każda równie chujowa). Historia musi być spójna i kontynuować poprzednie wydarzenia na podstawie wyboru gracza. Bądź kreatywny, mroczny i kurewsko zabawny. Czasem reaguj na bezczelne odzywki gracza. Nie dodawaj żadnych wyjaśnień ani tekstu poza wymaganym formatem JSON.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    story: {
      type: Type.STRING,
      description: "Fragment historii o Jaśku Kurewiuszu.",
    },
    choices: {
      type: Type.ARRAY,
      description: "Trzy opcje wyboru dla gracza.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["story", "choices"],
} as const;

const fallbackIntros = [
  "Tryb awaryjny bez AI: Jasiek budzi się z kacem większym niż ego lokalnego wójta.",
  "Brak dostępu do cholernego Gemini, więc Mistrz Gry improwizuje na żywo.",
  "Offline mode ON. Jasiek patrzy w pustkę, a pustka patrzy w niego jak na ćwoka.",
];

const fallbackComplications = [
  "W kieszeni znajduje rozjebaną zapalniczkę i wezwanie na komisariat.",
  "Z klatki schodowej dobiega krzyk sąsiadki, że ktoś mu zabrał ostatnią flaszkę.",
  "Telefon pika jak szalony, bo diler domaga się zaległych monet i grozi kiblowaniem.",
  "Na stole leży tajemniczy bilet na pociąg do Pcimia Dolnego z dopiskiem 'nie spierdol tego'.",
];

const fallbackTwists = [
  "Na dodatek na jego plecach siedzi kot sąsiada i żąda haraczu w whiskasie.",
  "Okazuje się, że cała melina jest nagle pełna kamer z programu interwencyjnego.",
  "Ktoś wypisał na drzwiach 'Kurewiusz ma oddać sprzęt do końca dnia' czerwonym sprayem.",
  "W lodówce zamiast jedzenia znajduje bilecik z rymowanką o morderczym klownie.",
];

const fallbackChoicePool = [
  "Zwinąć zapalniczkę", "Udawać trupa", "Zadzwonić po matkę", "Spierdolić przez okno",
  "Napisać do dilera", "Schować się w łazience", "Rozpętać burdę", "Otworzyć bilet", "Wyć do księżyca",
  "Złapać kota", "Pójść na komisariat", "Zrobić scenę sąsiadce",
];

const pickRandom = <T,>(items: readonly T[]): T => {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
};

const generateFallbackSegment = (log: LogEntry[]): StorySegment => {
  const lastChoice = [...log].reverse().find((entry) => entry.type === "choice");
  const intro = pickRandom(fallbackIntros);
  const complication = pickRandom(fallbackComplications);
  const twist = pickRandom(fallbackTwists);

  const storyBase = `${intro} ${complication} ${twist}`;
  const story = lastChoice
    ? `${storyBase} A wszystko to dlatego, że wcześniej wybrałeś '${lastChoice.text}', brawo geniuszu.`
    : `${storyBase} To dopiero początek kłopotów, a nawet jeszcze nic nie kliknąłeś.`;

  const availableChoices = [...fallbackChoicePool];
  const choices: string[] = [];

  while (choices.length < 3 && availableChoices.length > 0) {
    const choice = pickRandom(availableChoices);
    choices.push(choice);
    const choiceIndex = availableChoices.indexOf(choice);
    availableChoices.splice(choiceIndex, 1);
  }

  if (choices.length === 0) {
    choices.push("Od nowa");
  }

  return {
    story,
    choices,
  };
};

export const generateStorySegment = async (
  log: LogEntry[]
): Promise<StorySegment> => {
  try {
    const client = getClient();

    if (!client) {
      return generateFallbackSegment(log);
    }

    // Zamiana historii na listę "contents" zgodną z SDK
    const prompt =
      log
        .map((entry) =>
          `${entry.type === "story" ? "Mistrz Gry" : "Gracz"}: ${entry.text}`
        )
        .join("\n") + "\n\nWygeneruj następny fragment.";

    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.95,
      },
    });

    const jsonText = response.text;
    const cleanedJson = jsonText
      .trim()
      .replace(/^```json\n?/, "")
      .replace(/\n?```$/, "");

    const parsed = JSON.parse(cleanedJson) as StorySegment;
    if (!parsed.story || !Array.isArray(parsed.choices)) {
      throw new Error("Invalid JSON structure received from API.");
    }

    // Dodatkowe zabezpieczenie: zawsze zwróć przynajmniej jedną opcję
    if (parsed.choices.length === 0) {
      parsed.choices = ["Od nowa"];
    }

    return parsed;
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    if (error instanceof Error) {
      if (error.message.includes("JSON")) {
        return {
          story:
            "Wystąpił błąd formatu odpowiedzi. Spróbuj ponownie lub zresetuj grę.",
          choices: ["Od nowa"],
        };
      }

      if (error.message.includes("quota") || error.message.includes("429")) {
        return {
          story:
            "Gemini ma dziś dosyć twoich wybryków. Limit zapytań wyczerpany, więc Mistrz Gry jedzie improwizacją.",
          choices: ["Poczekaj chwilę", "Spróbuj mimo wszystko", "Od nowa"],
        };
      }

      if (
        error.message.includes("network") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes("fetch failed")
      ) {
        return {
          story:
            "Nie ma internetu, nie ma AI. Jasiek siedzi w offline'owej melinie i liczy, że ktoś mu rzuci kabel.",
          choices: ["Odśwież stronę", "Pobierz zapis", "Od nowa"],
        };
      }
    }

    return generateFallbackSegment(log);
  }
};