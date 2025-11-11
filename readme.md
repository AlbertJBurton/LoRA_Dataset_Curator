# The LoRA Dataset Creator

This application enables users to define a concept, such as a bowling ball, and submit a set of images associated with it. The application will utilize an API to assess the image's suitability as a training image for a Stable Diffusion LoRA (Low-Rank Adaptation) model. The application achieves this by grading the image against a scale of 0 to 1. The user can select the score necessary to accept the image for training; otherwise, the image is rejected. For all accepted images, the API generates a caption or a set of tags for the image based on the user’s preferences. Finally, the accepted images and their associated labels (in a .txt file) are downloadable in a ZIP archive.



## ✨ Key Features



-   **AI-Powered Scoring:** Each image is analyzed for its suitability to train a LoRA based on your specific concept, using a detailed grading rubric.

-   **Concept-Agnostic Tagging:** Automatically generates descriptive captions or tags for suitable images, carefully excluding the core concept to improve training quality.

-   **Flexible Model Support:**

    -   Connects to the **Gemini API** (`gemini-2.5-flash` or `gemini-2.5-pro`).

    -   Supports local inference via **LM Studio** for privacy and offline use.

-   **Configurable Threshold:** Use a slider to set the minimum acceptance score for images to be included in your dataset.

-   **One-Click Download:** Packages all accepted images and their corresponding `.txt` annotation files into a single `.zip` file, ready for training.



## Install and Run the Application

**Prerequisites:**  Node.js

Make sure node.js is installed on your system.

1. Clone the repository to a folder:
   
   `git clone https://github.com/AlbertJBurton/LoRA_Dataset_Curator`
   
3. Navigate to the `LoRA_Dataset_Curator` folder created in the previous step.

4. Install dependencies: You only have to do this once after downloading the application.
   
   `npm install`
   
5. Run the app:
   
   `npm run dev`

## API Model Selections

There are three models available for analyzing and tagging the images.

1. **Gemini 2.5 Flash**  - This model is optimized for speed and cost-efficiency while maintaining high performance. It's ideal for high-frequency, scalable tasks like conversational chat, summarization, and captioning.
2. **Gemini 2.5 Pro** - This is the most powerful and advanced model, designed for complex, multi-step reasoning, coding, and creative generation. It is the top-tier model for tasks that require a deep understanding.
3. **LM Studio** - This option allows the user to run the LLM of their choice and use LM Studio as the server interface to the LLM. This option offers the greatest flexibility in model choice without the associated costs of the Gemini models.

### Using Gemini Models ###

Both Gemini models require an API key. Visit https://aistudio.google.com/api-keys to generate your API key. There are free tiers with a processing allowance that is regenerated each month. Please note that, depending on your service tier, charges may apply for the API calls made by this application to the Gemini API. 

Set `GEMINI_API_KEY` in your machine's environment variables to your Gemini API key if you do not want to continually enter your Gemini API key on startup.

### Using LM Studio Models ###

If you are not familiar with running LM Studio as a local LLM API server, visit https://lmstudio.ai/docs/developer/core/server for a complete overview of the process.

The model you choose to serve from LM Studio should be a vision-enabled model. Otherwise, you will see an error message for the image analysis, such as:

LM Studio request failed with status 400: {"error":"Model does not support images. Please use a model that does."}



## 🚀 How to Use



### 1. API / Server Setup



The application needs to connect to an AI model to function.



-   **For Gemini API:**

    1.  The application will first look for an API key in the environment (`API_KEY` or `GEMINI_API_KEY`).

    2.  If an environment key is not found or is invalid, you will be prompted to enter your Gemini API key directly into the input field.

    3.  A successful connection will be indicated in the UI.



-   **For LM Studio:**

    1.  Select "LM Studio" from the model dropdown.

    2.  Ensure your LM Studio server is running.

    3.  Enter the server URL (defaults to `http://localhost:1234`).

    4.  The app will validate the connection and show which model is loaded.



### 2. Curation Process



1.  **Define Your Concept:** In the "Define Your Concept" field, describe the subject you want to train your LoRA on (e.g., "a crystal-clear mountain lake," "Art Deco architecture").

2.  **Upload Images:** Drag and drop your potential training images into the upload area.

3.  **Set Parameters:**

    -   Choose your desired **Model** (Gemini or LM Studio).

    -   Select the **Annotation Type** (single-sentence captions or comma-separated tags).

    -   Adjust the **Acceptance Score** slider. The rubric guide below the slider explains what each score range means.

4.  **Analyze:** Click the "Analyze Images" button. The application will process each image, providing real-time progress. You can stop the process at any time.

5.  **Review & Download:**

    -   Review the results in the gallery. Accepted images will be highlighted, while rejected ones will be faded with a reason for rejection.

    -   Click "Download Accepted" to get your final zipped dataset.
