from langgraph.graph import StateGraph, START, END
from app.state import AgentState
from app.nodes import generate_draft, generate_critique, generate_refinement

workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("drafter", generate_draft)
workflow.add_node("critic", generate_critique)
workflow.add_node("refiner", generate_refinement)

# Add Edges (Linear Logic for this example)
# START -> Draft -> Critique -> Refine -> END
workflow.add_edge(START, "drafter")
workflow.add_edge("drafter", "critic")
workflow.add_edge("critic", "refiner")
workflow.add_edge("refiner", END)

# Compile
graph = workflow.compile()