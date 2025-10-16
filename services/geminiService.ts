// Używamy nowego SDK Google GenAI; klient tworzymy późno (lazy), aby uniknąć problemów runtime.
import { GoogleGenAI, Type } from "@google/genai";
import { StorySegment, LogEntry } from "../types";

// Vite podczas bundlingu podmienia te wartości na literaly; brak klucza nie powinien psuć importu modułu
const API_KEY: string | undefined =
  (process.env.API_KEY as string | undefined) ||
  (process.env.GEMINI_API_KEY as string | undefined);

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
  // Fallback offline jeśli nie ma klucza API: generujemy pseudo-losowy fragment
  if (!API_KEY) {
    const insults = [
      "Świat patrzy na ciebie z niesmakiem.",
      "Wdepnąłeś w to po kostki i dalej brniesz.",
      "Los znowu cię kopnął, ale udajesz, że to masaż."
    ];
    const lastChoice = [...log].reverse().find(e => e.type === 'choice')?.text;
    const prefix = lastChoice ? `Po wyborze: "${lastChoice}" — ` : "";
    return {
      story: `${prefix}${insults[Math.floor(Math.random() * insults.length)]}`,
      choices: ["W lewo", "W prawo", "Od nowa"],
    };
  }

  try {
    // Tworzymy klienta dopiero przy użyciu, aby uniknąć błędów przy imporcie
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai: any = new GoogleGenAI({ apiKey: API_KEY });

    // Kontekst rozmowy w czytelnej formie promptu
    const prompt =
      log
        .map((entry) =>
          `${entry.type === "story" ? "Mistrz Gry" : "Gracz"}: ${entry.text}`
        )
        .join("\n") + "\n\nWygeneruj następny fragment.";

    // Większość wersji SDK akceptuje contents jako strukturę ról i parts
    const contents = [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    // Próba wywołania nowego endpointu SDK; parametry w config/systemInstruction
    const response: any = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.95,
      },
    });

    // Różne wersje SDK zwracają tekst jako właściwość lub metodę
    const rawText = typeof response?.text === "function" ? response.text() : response?.text;
    const jsonText = (await Promise.resolve(rawText)) as string;

    const cleanedJson = jsonText
      .trim()
      .replace(/^```json\n?/, "")
      .replace(/\n?```$/, "");

    const parsed = JSON.parse(cleanedJson) as StorySegment;
    if (!parsed.story || !Array.isArray(parsed.choices)) {
      throw new Error("Invalid JSON structure received from API.");
    }

    if (parsed.choices.length === 0) {
      parsed.choices = ["Od nowa"];
    }

    return parsed;
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    if (error instanceof Error) {
      const msg = error.message || "";
      if (msg.toLowerCase().includes("json")) {
        return {
          story:
            "Wystąpił błąd formatu odpowiedzi. Spróbuj ponownie lub zresetuj grę.",
          choices: ["Od nowa"],
        };
      }
      if (msg.includes("API key") || msg.includes("401")) {
        throw new Error(
          "Nieprawidłowy klucz API. Sprawdź swój GEMINI_API_KEY w pliku .env"
        );
      }
      if (msg.toLowerCase().includes("quota") || msg.includes("429")) {
        throw new Error(
          "Przekroczono limit zapytań do API. Spróbuj ponownie za chwilę."
        );
      }
      if (msg.toLowerCase().includes("network") || msg.includes("ENOTFOUND")) {
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