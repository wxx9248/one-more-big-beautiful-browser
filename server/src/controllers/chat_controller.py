from typing import Annotated, TypedDict
import os

from langchain.chat_models import init_chat_model
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

from src.core.config import get_settings


class State(TypedDict):
    """State of the chat graph."""

    messages: Annotated[list, add_messages]


class ChatController:
    """Controller for handling chat using LangGraph."""

    def __init__(self):
        """Initialize the chat controller."""
        settings = get_settings()
        self.settings = settings

        # Set all available API keys as environment variables
        self._setup_api_keys()

        # Store default model and temperature
        self.default_model = settings.langgraph.default_model
        self.default_temperature = settings.langgraph.temperature

    def _setup_api_keys(self):
        """Set up all available API keys in environment variables."""
        api_keys = self.settings.llm_api_keys

        # Map each API key to its environment variable
        key_mappings = {
            "ANTHROPIC_API_KEY": api_keys.anthropic_api_key,
            "OPENAI_API_KEY": api_keys.openai_api_key,
            "GOOGLE_API_KEY": api_keys.google_api_key,
        }

        # Set environment variables for all configured API keys
        for env_var, key_value in key_mappings.items():
            if key_value:
                os.environ[env_var] = key_value

    def _convert_messages(self, messages: list):
        """
        Convert frontend message objects to LangChain format.

        Args:
            messages: List of message objects with role and content attributes

        Returns:
            List of tuples in format (role, content)
        """
        converted_messages = []
        for msg in messages:
            # Handle both Pydantic models and dict formats
            role = msg.role if hasattr(msg, "role") else msg.get("role")
            content = msg.content if hasattr(msg, "content") else msg.get("content")

            # Convert role names to LangChain format
            if role == "user":
                converted_messages.append(("user", content))
            elif role == "assistant":
                converted_messages.append(("assistant", content))
            elif role == "system":
                converted_messages.append(("system", content))
            else:
                # Default to user if role is unknown
                converted_messages.append(("user", content))

        return converted_messages

    def _get_llm(self, model: str, temperature: float):
        """
        Get an LLM instance for the specified model.

        Args:
            model: Model string in format "provider:model-name"
            temperature: Temperature for generation

        Returns:
            LLM instance
        """
        return init_chat_model(model, temperature=temperature)

    def _build_graph(self, llm) -> StateGraph:
        """
        Build the LangGraph chat graph with the specified LLM.

        Args:
            llm: LLM instance to use

        Returns:
            Compiled StateGraph
        """
        # Create the graph
        graph_builder = StateGraph(State)

        # Add the chat node
        def chatbot(state: State):
            """Chat node that processes messages using LLM."""
            return {"messages": [llm.invoke(state["messages"])]}

        graph_builder.add_node("chatbot", chatbot)

        # Add edges
        graph_builder.add_edge(START, "chatbot")
        graph_builder.add_edge("chatbot", END)

        # Compile without checkpointer - frontend manages conversation history
        # This makes the backend stateless and more scalable
        return graph_builder.compile()

    async def chat(
        self,
        messages: list,
        model: str | None = None,
        temperature: float | None = None,
    ):
        """
        Process chat messages using LangGraph.

        Args:
            messages: Complete list of message objects with role and content (including full history)
            model: Optional model to use (format: "provider:model-name")
            temperature: Optional temperature for generation

        Returns:
            Dict with response message and used model
        """
        # Use provided model or default
        used_model = model or self.default_model
        used_temperature = (
            temperature if temperature is not None else self.default_temperature
        )

        # Convert messages to LangChain format
        converted_messages = self._convert_messages(messages)

        # Get LLM instance for this request
        llm = self._get_llm(used_model, used_temperature)

        # Build graph with the selected LLM
        graph = self._build_graph(llm)

        # Invoke the graph with converted messages
        result = graph.invoke({"messages": converted_messages})

        # Extract the last message (the assistant's response)
        last_message = result["messages"][-1]

        return {
            "message": last_message.content,
            "model": used_model,
        }
