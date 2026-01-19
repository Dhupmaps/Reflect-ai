import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.state import AgentState

load_dotenv()

llm = ChatOpenAI(model="gpt-4o", api_key=os.getenv("OPENAI_API_KEY"))

def generate_draft(state: AgentState):
    """Node 1: Writes the initial answer."""
    msg = [
        SystemMessage(content="You are a helpful assistant. Write a detailed draft answer."),
        HumanMessage(content=state["question"])
    ]
    response = llm.invoke(msg)
    return {"draft": response.content, "status": "Drafting"}

def generate_critique(state: AgentState):
    """Node 2: Critiques the draft."""
    msg = [
        SystemMessage(content="""You are a strict professor. Critique the following draft.
        
        RETURN THE ORIGINAL TEXT WITH CRITIQUES INSERTED INLINE.
        
        Format your critiques like this: **[Critique: Your critique here]**
        The critique text usually points out missing details, wrong facts, or unclear explanations.
        Make sure the critiques are in BOLD so they stand out."""),
        HumanMessage(content=f"Question: {state['question']}\n\nDraft Answer: {state['draft']}")
    ]
    response = llm.invoke(msg)
    return {"critique": response.content, "status": "Critiquing"}

def generate_refinement(state: AgentState):
    """Node 3: Rewrites the answer based on critique, providing 2 options."""
    msg = [
        SystemMessage(content="""You are an expert editor. Rewrite the draft based on the critique to create a perfect final answer.
        
        You must provide TWO different versions of the refined answer.
        
        Version 1: A formal, academic improvement.
        Version 2: A simpler, more engaging and accessible improvement.
        
        Separate them clearly with a delimiter "|||SPLIT|||".
        
        For BOTH versions, append the logic changes section:
        ### Changes Made
        - Bullet points...
        """),
        HumanMessage(content=f"Original Draft: {state['draft']}\n\nCritique: {state['critique']}")
    ]
    response = llm.invoke(msg)
    
    parts = response.content.split("|||SPLIT|||")
    ans1 = parts[0].strip() if len(parts) > 0 else response.content
    ans2 = parts[1].strip() if len(parts) > 1 else "Second option generation failed."

    return {
        "final_answer_1": ans1, 
        "final_answer_2": ans2, 
        "status": "Completed"
    }

def generate_title(question: str):
    """Helper to generate a short title for the chat."""
    msg = [
        SystemMessage(content="Summarize the following question into a short, catchy title (max 5 words). Do not use quotes."),
        HumanMessage(content=question)
    ]
    response = llm.invoke(msg)
    return response.content.strip()