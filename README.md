# Reflect AI

Reflect AI is an advanced chat application featuring a multi-stage reasoning engine. It goes beyond simple request-response interactions by employing a **Draft -> Critique -> Refine** workflow to deliver high-quality, thought-out answers.

## 🚀 Features

- **Multi-Stage Reasoning**: The AI generates a draft, critiques its own work, and then refines it for optimal quality.
- **Dual Final Answers**: Provides two variations of the final answer to give users diverse perspectives or options.
- **Chat History**: Persists chat sessions and messages for easy retrieval.
- **Real-time Streaming**: improved user experience with real-time status updates (Drafting, Critiquing, Refining).
- **Modern UI**: Built with React and Vite for a fast, responsive experience.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Lucide React, Tailwind CSS (assumed based on standard modern stacks)
- **Backend**: Python, FastAPI, Uvicorn
- **AI/LLM Logic**: LangGraph, LangChain (OpenAI, HuggingFace)
- **Database**: Simple file-based persistence (likely SQLite/JSON based on `database.py`)

## 📦 Installation & Setup

### Prerequisites

- Node.js (v18+)
- Python (v3.9+)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/reflect-ai.git
cd reflect-ai
```

### 2. Backend Setup

navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment (optional but recommended):

```bash
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the server:

```bash
uvicorn app.server:app --reload
```

The backend API will be available at `http://localhost:8000`.

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will be running at `http://localhost:5173`.

## 📝 Usage

1.  Open the frontend URL.
2.  Start a new chat.
3.  Ask a complex question.
4.  Watch as Reflect AI drafts, critiques, and refines its answer in real-time.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
