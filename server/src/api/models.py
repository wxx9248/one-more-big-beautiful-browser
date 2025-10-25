"""
Base Pydantic models for API endpoints.

This module provides base models with camelCase field aliases
to ensure JSON compliance with lowerCamelCase naming conventions.
"""

from pydantic import BaseModel, ConfigDict


def snake_to_camel(snake_str: str) -> str:
    """Convert snake_case to camelCase."""
    components = snake_str.split("_")
    return components[0] + "".join(word.capitalize() for word in components[1:])


class CamelCaseModel(BaseModel):
    """Base model with camelCase field aliases."""

    model_config = ConfigDict(
        alias_generator=snake_to_camel,
        populate_by_name=True,
        from_attributes=True,
        use_enum_values=True,
    )

    def model_dump(self, **kwargs):
        """Override model_dump to use aliases by default."""
        kwargs.setdefault("by_alias", True)
        return super().model_dump(**kwargs)

    def model_dump_json(self, **kwargs):
        """Override model_dump_json to use aliases by default."""
        kwargs.setdefault("by_alias", True)
        return super().model_dump_json(**kwargs)
