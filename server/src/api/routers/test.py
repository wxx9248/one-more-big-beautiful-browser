from fastapi import APIRouter
from src.api.models import CamelCaseModel

router = APIRouter()


class TestRequest(CamelCaseModel):
    pass


class TestResponse(CamelCaseModel):
    test_field: str


@router.get(
    "/",
    response_model=TestResponse,
    responses={
        200: {"description": "Default", "model": TestResponse},
    },
)
async def test(
    request: TestRequest,
):
    return TestResponse(test_field="Hello world")
