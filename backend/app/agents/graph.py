from langgraph.graph import StateGraph, END
from datetime import datetime

from app.agents.state import AgentState
from app.agents.nodes import node_classify, node_route, node_resolve
from app.models.schemas import QueryRequest, QueryResponse, Meta


# ── Build Graph ───────────────────────────────────────────────────────────────

def build_graph():
    graph = StateGraph(AgentState)

    # Register nodes
    graph.add_node("classify", node_classify)
    graph.add_node("route",    node_route)
    graph.add_node("resolve",  node_resolve)

    # Linear edges — no branching needed
    # Routing logic lives inside node_route itself
    graph.set_entry_point("classify")
    graph.add_edge("classify", "route")
    graph.add_edge("route",    "resolve")
    graph.add_edge("resolve",  END)

    return graph.compile()


# Compiled graph — import this everywhere
pipeline = build_graph()


# ── Runner ────────────────────────────────────────────────────────────────────

async def run_pipeline(request: QueryRequest) -> QueryResponse:
    """
    Hydrates AgentState from a QueryRequest,
    runs the compiled graph,
    returns a fully populated QueryResponse.
    """
    initial_state: AgentState = {
        "query_id":           request.query_id,
        "platform":           request.platform,
        "timestamp":          request.timestamp,
        "message":            request.message,
        "customer":           request.customer,
        "node_classify":      None,
        "node_route":         None,
        "node_resolve":       None,
        "llm_used":           False,
        "started_at":         datetime.utcnow(),
        "processing_time_ms": 0,
    }

    final_state: AgentState = await pipeline.ainvoke(initial_state)

    return QueryResponse(
        query_id      = final_state["query_id"],
        platform      = final_state["platform"],
        timestamp     = final_state["timestamp"],
        message       = final_state["message"],
        customer      = final_state["customer"],
        node_classify = final_state["node_classify"],
        node_route    = final_state["node_route"],
        node_resolve  = final_state["node_resolve"],
        meta          = Meta(
            llm_used           = final_state["llm_used"],
            processing_time_ms = final_state["processing_time_ms"],
            graph_version      = "1.0",
        ),
    )