from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.graph import graph
import app.database as db
import uuid
import json
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    title: str

class MessageRequest(BaseModel):
    chat_id: str
    question: str

@app.get("/chats")
async def list_chats():
    return db.get_chats()

@app.post("/chats")
async def create_chat(req: ChatRequest):
    chat_id = str(uuid.uuid4())
    db.create_chat(chat_id, req.title)
    return {"id": chat_id, "title": req.title}

@app.get("/chats/{chat_id}")
async def get_chat_history(chat_id: str):
    return db.get_chat_messages(chat_id)

@app.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str):
    db.delete_chat(chat_id)
    return {"status": "deleted"}

@app.put("/chats/{chat_id}/title")
async def update_chat_title(chat_id: str, req: ChatRequest):
    db.update_chat_title(chat_id, req.title)
    return {"status": "updated", "title": req.title}

@app.post("/regenerate")
async def regenerate_answer(req: MessageRequest):
    # Retrieve last state manually or re-run refinement node (simplified for now)
    # For a real agent, we'd load the checkpoint. 
    # Here we will re-run the refinement node with the LAST user message and AI draft/critique.
    # Since we don't store full state in DB, this is tricky. 
    # For now, let's just re-run the whole graph but tell the user we are regenerating.
    # A true regeneration would require langgraph checkpoints.
    return await process_question(req)

@app.post("/process")
async def process_question(req: MessageRequest):
    async def event_generator():
        # 1. Save User Message
        db.add_message(req.chat_id, "user", req.question)
        
        # Check if chat needs a title (if it's the first message)
        # We can implement this optimization later or let frontend trigger it.
        # Let's emit a title event if it's a new chat.
        current_msgs = db.get_chat_messages(req.chat_id)
        if len(current_msgs) <= 1: # Just added the user message
            from app.nodes import generate_title
            new_title = generate_title(req.question)
            db.update_chat_title(req.chat_id, new_title)
            yield json.dumps({"type": "title_update", "title": new_title}) + "\n"
        
        initial_state = {"question": req.question}
        
        # 2. Invoke Graph
        final_state = graph.invoke(initial_state)
        
        # 3. Stream back the phases
        yield json.dumps({"type": "status", "status": "Drafting"}) + "\n"
        await asyncio.sleep(0.5)
        yield json.dumps({"type": "draft", "content": final_state.get("draft")}) + "\n"
        
        yield json.dumps({"type": "status", "status": "Critiquing"}) + "\n"
        await asyncio.sleep(0.5)
        yield json.dumps({"type": "critique", "content": final_state.get("critique")}) + "\n"
        
        yield json.dumps({"type": "status", "status": "Refining"}) + "\n"
        await asyncio.sleep(0.5)
        
        # Support dual answers
        final_1 = final_state.get("final_answer_1")
        final_2 = final_state.get("final_answer_2")
        
        yield json.dumps({
            "type": "final", 
            "content": final_1, # Default or primary 
            "content_2": final_2 
        }) + "\n"
        
        # 4. Save AI Response (Full Rich Object)
        rich_response = {
            "draft": final_state.get("draft"),
            "critique": final_state.get("critique"),
            "final_1": final_1,
            "final_2": final_2
        }
        db.add_message(req.chat_id, "ai", json.dumps(rich_response))
        
        yield json.dumps({"type": "course_completed", "status": "Completed"}) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")