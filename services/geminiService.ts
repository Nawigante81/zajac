import { GoogleGenAI, Type } from "@google/genai";
import { StorySegment, LogEntry } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = "gemini-2.5-flash";

const systemInstruction = `Jesteś cynicznym, wulgarnym i sadystycznym mistrzem gry w stylu retro RPG. Twoim zadaniem jest opowiadanie interaktywnej historii o gościu imieniem Jasiek, znanym szerzej jako Zając lub po prostu Kurewiusz. Jasiek to totalny dupek, skurwysyn i pechowiec. Zwracaj się do gracza per 'ty' i nie szczędź mu obelg. Używaj barwnego, kreatywnie wulgarnego języka polskiego. Każda twoja odpowiedź musi być wyłącznie w formacie JSON zgodnym z podanym schematem. JSON powinien zawierać dwa pola: 'story' (krótki, 2-3 zdaniowy fragment historii opisujący popierdoloną sytuację Jaśka) oraz 'choices' (tablica z 3 zwięzłymi, jedno- lub dwuwyrazowymi opcjami wyboru dla gracza, każda równie chujowa). Historia musi być spójna i kontynuować poprzednie wydarzenia na podstawie wyboru gracza. Bądź kreatywny, mroczny i kurewsko zabawny. Czasem reaguj na bezczelne odzywki gracza. Nie dodawaj żadnych wyjaśnień ani tekstu poza wymaganym formatem JSON.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    story: {
      type: Type.STRING,
      description: 'Fragment historii o Jaśku Kurewiuszu.',
    },
    choices: {
      type: Type.ARRAY,
      description: 'Trzy opcje wyboru dla gracza.',
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ['story', 'choices'],
};


export const generateStorySegment = async (log: LogEntry[]): Promise<StorySegment> => {
  try {
    const history = log
      .map(entry => `${entry.type === 'story' ? 'Mistrz Gry' : 'Gracz'}: ${entry.text}`)
      .join('\n');
      
    const prompt = `Oto dotychczasowy przebieg gry:\n${history}\n\nWygeneruj następny fragment.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.95,
      },
    });

    const jsonText = response.text.trim();
    // Basic cleanup in case of markdown block
    const cleanedJson = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    
    const parsed = JSON.parse(cleanedJson) as StorySegment;
    if (!parsed.story || !Array.isArray(parsed.choices)) {
        throw new Error("Invalid JSON structure received from API.");
    }
    return parsed;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        return {
            story: "Cholera, zaciąłem się. Coś poszło nie tak z moją parszywą narracją. Spróbujmy jeszcze raz, kurwa.",
            choices: ["Od nowa"],
        };
    }
    throw new Error("Failed to generate story segment. The API might be down or your key is invalid.");
  }
};