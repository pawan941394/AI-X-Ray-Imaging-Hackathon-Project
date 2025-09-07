<!-- LOGO -->
<div align="center">
  <img src="https://via.placeholder.com/80x80.png?text=Logo" alt="Logo" width="80" height="80">
  <h1 align="center">MedX Tutor</h1>
  <p align="center">
    An AI-powered medical imaging assistant for students and educators.
    <br />
    <br />
    <!-- TODO: Add your live demo link here -->
    <a href="#"><strong>Explore the Live Demo »</strong></a>
    <br />
    <br />
  </p>
</div>

<!-- BADGES -->
<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Google Gemini">
</div>

---

## ✨ Introduction

MedX Tutor is a cutting-edge educational tool designed to bridge the gap between theoretical medical knowledge and practical radiographic interpretation. Powered by Google's Gemini AI, it allows medical students, residents, and educators to:

-   **Generate** realistic, synthetic X-ray images from simple text descriptions.
-   **Upload** existing X-ray images for detailed AI analysis.
-   **Learn** through AI-generated explanations, interactive quizzes, and a contextual chat assistant.

This project aims to provide a safe and effective environment for honing diagnostic skills without the need for real patient data.

## 🚀 Key Features

-   **📝 Natural Language Prompting:** Describe a condition in plain English or Hindi (e.g., "fractured left hand"), and the AI generates a clinically accurate prompt and a corresponding X-ray.
-   **🖼️ High-Quality Image Generation:** Creates realistic, high-contrast grayscale X-ray images using the `imagen-4.0-generate-001` model.
-   **⬆️ Upload & Analyze:** Upload your own X-ray images for the AI to analyze and describe.
-   **🧠 Detailed Explanations:** Receive structured, beginner-friendly explanations covering findings, causes, and typical treatments.
-   **✅ Interactive Quizzes:** Test your knowledge with AI-generated multiple-choice questions based on the X-ray scenario.
-   **💬 Contextual AI Chat:** Ask follow-up questions about the X-ray, and the AI will provide answers based on the image context.
-   **👆 Image Explorer:** A unique point-and-ask feature. Click on any part of the image, and the AI will provide a detailed explanation and an annotated diagram of that specific area.
-   **📄 PDF & Image Export:** Download the generated X-ray and a comprehensive report for offline study.

## 🎬 Live Demo & Walkthrough

Here’s a quick look at the two primary workflows in MedX Tutor.

_**Note:** These are placeholder GIFs. Create your own screen recordings (we recommend using a tool like LICEcap or Kap) and replace the URLs below._

### 1. Generating an X-Ray from a Text Prompt

Simply describe the patient's condition, set the age and gender, and watch the AI bring it to life.

![Generate Workflow Demo](https://via.placeholder.com/800x450.gif?text=Your+Generate+Workflow+GIF+Here)

### 2. Uploading and Analyzing an Existing X-Ray

Upload an image from your computer, and the AI will provide a full analysis, explanation, and quiz.

![Upload Workflow Demo](https://via.placeholder.com/800x450.gif?text=Your+Upload+Workflow+GIF+Here)


## 🛠️ How It Works: A Deeper Look

_**Note:** Replace the placeholder URLs below with actual screenshots of your application._

#### 1. Input & Generation
The user provides a simple description. MedX Tutor uses `gemini-2.5-flash` to refine this into a detailed clinical prompt, which is then passed to `imagen-4.0-generate-001` to create the X-ray image.

<p align="center">
  <img src="https://via.placeholder.com/800x500.png?text=Screenshot+of+Input+Screen" alt="Input Screen" width="700">
</p>

#### 2. Analysis & Explanation
Once an image is generated or uploaded, the AI provides a comprehensive breakdown, including the clinical prompt and a structured medical explanation.

<p align="center">
  <img src="https://via.placeholder.com/800x600.png?text=Screenshot+of+Explanation+Screen" alt="Explanation Screen" width="700">
</p>

#### 3. Interactive Learning Tools
Reinforce your learning with automatically generated quizzes and a contextual chat assistant that knows the specifics of the current X-ray.

<p align="center">
  <img src="https://via.placeholder.com/800x400.png?text=Screenshot+of+Quiz+Feature" alt="Quiz Feature" width="700">
</p>

#### 4. Image Explorer (Point-and-Ask)
Click anywhere on the image to open the Explorer. The AI (`gemini-2.5-flash-image-preview`) analyzes the specific point, provides a targeted explanation, and generates a new, annotated diagram for clarity.

<p align="center">
  <img src="https://via.placeholder.com/800x550.png?text=Screenshot+of+Image+Explorer" alt="Image Explorer Feature" width="700">
</p>

## 💻 Tech Stack

-   **Frontend:** React, TypeScript, Tailwind CSS
-   **AI / Backend:** Google Gemini API
    -   `gemini-2.5-flash` for text generation, analysis, and chat.
    -   `imagen-4.0-generate-001` for X-ray image generation.
    -   `gemini-2.5-flash-image-preview` for the Image Explorer feature.
-   **Deployment:** Designed for modern hosting platforms like Vercel or Netlify.

## 🔧 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v18 or later)
-   npm or yarn
-   A Google Gemini API Key

### Installation

1.  **Clone the repo:**
    ```sh
    git clone https://github.com/your_username/MedX-Tutor.git
    cd MedX-Tutor
    ```
2.  **Install NPM packages:**
    ```sh
    npm install
    ```
3.  **Set up your environment variables:**
    Your project is set up to read the API key from the environment. Ensure `process.env.API_KEY` is available in your deployment environment. For local development, you might create a script to set this variable.

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open the local server URL provided in your console to view it in the browser.

## ⚠️ Disclaimer

<div align="center" style="background-color: #333; padding: 10px; border-radius: 5px; color: #ffcc00;">
  <strong>For educational purposes only. Not for real medical diagnosis.</strong>
  <br>
  All generated images are synthetic and should not be used for clinical decision-making.
</div>

## 👤 Author

**Pawan Kumar**

-   LinkedIn: [@pawan941394](https://www.linkedin.com/in/pawan941394/)
-   YouTube: [@Pawankumar-py4tk](https://www.youtube.com/@Pawankumar-py4tk)

---
<p align="center">
  Made with ❤️ and a passion for medical education.
</p>
