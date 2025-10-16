import { GoogleGenAI, Type } from "@google/genai";
import { StorySegment, LogEntry } from "../types";

const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error(
    "GEMINI_API_KEY environment variable not set. Please add your API key to .env file."
  );
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
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

export const generateStorySegment = async (
  log: LogEntry[]
): Promise<StorySegment> => {
  try {
    // Zamiana historii na listę "contents" zgodną z SDK
    const prompt =
      log
        .map((entry) =>
          `${entry.type === "story" ? "Mistrz Gry" : "Gracz"}: ${entry.text}`
        )
        .join("\n") + "\n\nWygeneruj następny fragment.";

    const response = await ai.models.generateContent({
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

      if (error.message.includes("API key") || error.message.includes("401")) {
        throw new Error(
          "Nieprawidłowy klucz API. Sprawdź swój GEMINI_API_KEY w pliku .env"
        );
      }

      if (error.message.includes("quota") || error.message.includes("429")) {
        throw new Error(
          "Przekroczono limit zapytań do API. Spróbuj ponownie za chwilę."
        );
      }

      if (error.message.includes("network") || error.message.includes("ENOTFOUND")) {
        throw new Error(
          "Brak połączenia z internetem lub API jest niedostępne."
        );
      }
    }

    throw new Error(
      "Nie udało się wygenerować fragmentu historii. API może być niedostępne lub klucz jest nieprawidłowy."
    );
  }
};