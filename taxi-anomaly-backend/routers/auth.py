from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest):
    # Accept any email/password for the demo
    if not request.email or not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    
    return TokenResponse(
        access_token="mock_jwt_token_for_demo",
        token_type="bearer",
        user={"email": request.email, "role": "admin"}
    )
