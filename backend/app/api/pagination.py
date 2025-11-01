"""
Pagination utilities for API endpoints.
"""
from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response model."""
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


def paginate_query(query, page: int = 1, page_size: int = 20):
    """
    Paginate a SQLAlchemy query.
    
    Args:
        query: SQLAlchemy query object
        page: Page number (1-indexed)
        page_size: Number of items per page
    
    Returns:
        Tuple of (paginated_items, total_count, total_pages)
    """
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 20
    if page_size > 100:
        page_size = 100  # Max page size
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return items, total, total_pages

