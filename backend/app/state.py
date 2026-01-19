from typing import TypedDict, Optional

class AgentState(TypedDict):
    question: str
    draft: Optional[str]
    critique: Optional[str]
    final_answer_1: Optional[str]
    final_answer_2: Optional[str]
    status: str 