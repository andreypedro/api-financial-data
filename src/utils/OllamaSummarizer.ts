import axios, { AxiosError } from 'axios';

// Define interfaces for Ollama API request options and response structure
interface OllamaGenerateRequestOptions {
   temperature?: number;
   top_k?: number;
   top_p?: number;
   num_ctx?: number; // Maximum context window for the model
   // Add any other Ollama API options you might need
}

interface OllamaGenerateResponse {
   model: string;
   created_at: string;
   response: string; // The generated text (our summary)
   done: boolean;
   // Other metadata like total_duration, prompt_eval_count, etc.
}

/**
 * A utility class to simplify calling a local Ollama instance for text summarization.
 * This class primarily handles the API communication. For processing very long documents,
 * you'll still need to perform text chunking *before* passing the text to this class's methods,
 * often using tools like LangChain.js.
 */
export class OllamaSummarizer {
   private ollamaBaseUrl: string;
   private defaultModel: string;

   /**
    * Initializes the OllamaSummarizer with the base URL for your Ollama instance
    * and a default model to use.
    * @param ollamaBaseUrl The base URL where your Ollama server is running (default: 'http://localhost:11434').
    * @param defaultModel The name of the Ollama model to use by default (default: 'phi-3-mini').
    */
   constructor(
      ollamaBaseUrl: string = 'http://localhost:11434',
      defaultModel: string = 'gemma3:12b'
   ) {
      this.ollamaBaseUrl = ollamaBaseUrl;
      this.defaultModel = defaultModel;
   }

   /**
    * Summarizes the provided text using the specified Ollama model.
    *
    * @param textToSummarize The text content that needs to be summarized.
    * @param model Optional: The specific Ollama model to use for this request. If not provided, the defaultModel is used.
    * @param summaryInstructions Optional: Specific instructions to guide the summary (e.g., 'de forma concisa', 'com os pontos principais').
    * @param options Optional: An object containing additional Ollama API parameters (like temperature, top_k, top_p).
    * @returns A Promise that resolves with the summarized text.
    * @throws {Error} If there's an issue with the Ollama API call (e.g., network error, model not found, invalid response).
    */
   public async summarize(
      textToSummarize: string,
      summaryInstructions: string,
      options?: OllamaGenerateRequestOptions
   ): Promise<string> {
      const targetModel = this.defaultModel;
      const generateUrl = `${this.ollamaBaseUrl}/api/generate`;

      // Constructing the prompt is key to getting a good summary
      const prompt = `${summaryInstructions}\n\n"""\n${textToSummarize}\n"":`;

      try {
         const response = await axios.post<OllamaGenerateResponse>(
            generateUrl,
            {
               model: targetModel,
               prompt: prompt,
               stream: false, // Request the full response at once
               options: options || {}, // Pass any custom options
            },
            {
               headers: {
                  'Content-Type': 'application/json',
               },
               timeout: 60000, // Set a timeout for the API call (30 seconds)
            }
         );

         console.log('OLLAMA RESPONSE:', response.data);

         // Validate the response structure
         if (!response.data || typeof response.data.response !== 'string') {
            throw new Error(
               'Unexpected response format from Ollama API: "response" field is missing or not a string.'
            );
         }

         return response.data.response.trim(); // Return the cleaned summary
      } catch (error) {
         if (axios.isAxiosError(error)) {
            let errorMessage = `Error calling Ollama API for summarization with model '${targetModel}': `;
            const axiosError = error as AxiosError;

            if (axiosError.response) {
               // The server responded with a status outside of 2xx range
               errorMessage += `Status ${axiosError.response.status}. Data: ${JSON.stringify(
                  axiosError.response.data
               )}`;
               if (
                  axiosError.response.status === 404 &&
                  JSON.stringify(axiosError.response.data).includes(
                     `model '${targetModel}' not found`
                  )
               ) {
                  errorMessage += `\nEnsure the model '${targetModel}' is installed (ollama pull ${targetModel}) and the Ollama server is running.`;
               }
            } else if (axiosError.request) {
               // The request was made but no response was received (e.g., Ollama server is down)
               errorMessage += `No response received. Verify that the Ollama server is running at '${this.ollamaBaseUrl}'.`;
            } else {
               // Something else happened in setting up the request
               errorMessage += `Request setup error: ${axiosError.message}`;
            }
            throw new Error(errorMessage);
         } else {
            throw new Error(`Unknown error during summarization: ${error}`);
         }
      }
   }
}
