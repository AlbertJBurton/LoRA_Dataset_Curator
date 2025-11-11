# The LoRA Dataset Creator

This application enables users to define a concept, such as a bowling ball, and submit a set of images associated with it. The application will utilize an API to assess the image's suitability as a training image for a Stable Diffusion LoRA (Low-Rank Adaptation) model. The application achieves this by grading the image against a scale of 0 to 1. The user can select the score necessary to accept the image for training; otherwise, the image is rejected. For all accepted images, the API generates a caption or a set of tags for the image based on the user’s preferences. Finally, the accepted images and their associated labels (in a .txt file) are downloadable in a ZIP archive.

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

