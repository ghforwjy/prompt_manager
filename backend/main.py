from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, joinedload
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI(title="Prompt Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = "sqlite:///./prompts.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    prompts = relationship("Prompt", back_populates="category")


class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)


class PromptTag(Base):
    __tablename__ = "prompt_tags"
    prompt_id = Column(Integer, ForeignKey("prompts.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)


class Prompt(Base):
    __tablename__ = "prompts"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    category = relationship("Category")
    tags = relationship("Tag", secondary="prompt_tags")


Base.metadata.create_all(bind=engine)


class CategoryCreate(BaseModel):
    name: str


class TagCreate(BaseModel):
    name: str


class PromptCreate(BaseModel):
    title: str
    content: str
    category_id: int
    tag_ids: Optional[List[int]] = []


class PromptUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None


class TagResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class PromptResponse(BaseModel):
    id: int
    title: str
    content: str
    category_id: int
    category: Optional[CategoryResponse] = None
    tags: List[TagResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Prompt Manager API"}


@app.get("/categories", response_model=List[CategoryResponse])
def get_categories():
    db = SessionLocal()
    try:
        categories = db.query(Category).all()
        return categories
    finally:
        db.close()


@app.post("/categories", response_model=CategoryResponse)
def create_category(category: CategoryCreate):
    db = SessionLocal()
    try:
        db_category = Category(name=category.name)
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category
    finally:
        db.close()


@app.delete("/categories/{category_id}")
def delete_category(category_id: int):
    db = SessionLocal()
    try:
        category = db.query(Category).filter(Category.id == category_id).first()
        if category:
            db.delete(category)
            db.commit()
            return {"message": "Category deleted"}
        return {"error": "Category not found"}
    finally:
        db.close()


@app.get("/tags", response_model=List[TagResponse])
def get_tags():
    db = SessionLocal()
    try:
        tags = db.query(Tag).all()
        return tags
    finally:
        db.close()


@app.post("/tags", response_model=TagResponse)
def create_tag(tag: TagCreate):
    db = SessionLocal()
    try:
        db_tag = Tag(name=tag.name)
        db.add(db_tag)
        db.commit()
        db.refresh(db_tag)
        return db_tag
    finally:
        db.close()


@app.delete("/tags/{tag_id}")
def delete_tag(tag_id: int):
    db = SessionLocal()
    try:
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if tag:
            db.delete(tag)
            db.commit()
            return {"message": "Tag deleted"}
        return {"error": "Tag not found"}
    finally:
        db.close()


@app.get("/prompts", response_model=List[PromptResponse])
def get_prompts(search: Optional[str] = None, category_id: Optional[int] = None):
    db = SessionLocal()
    try:
        query = db.query(Prompt).options(joinedload(Prompt.category), joinedload(Prompt.tags))
        if search:
            query = query.filter(Prompt.title.contains(search) | Prompt.content.contains(search))
        if category_id:
            query = query.filter(Prompt.category_id == category_id)
        prompts = query.all()
        return prompts
    finally:
        db.close()


@app.get("/prompts/{prompt_id}", response_model=PromptResponse)
def get_prompt(prompt_id: int):
    db = SessionLocal()
    try:
        prompt = db.query(Prompt).options(joinedload(Prompt.category), joinedload(Prompt.tags)).filter(Prompt.id == prompt_id).first()
        return prompt
    finally:
        db.close()


@app.post("/prompts", response_model=PromptResponse)
def create_prompt(prompt: PromptCreate):
    db = SessionLocal()
    try:
        db_prompt = Prompt(
            title=prompt.title,
            content=prompt.content,
            category_id=prompt.category_id
        )
        db.add(db_prompt)
        db.commit()
        db.refresh(db_prompt)
        
        if prompt.tag_ids:
            tags = db.query(Tag).filter(Tag.id.in_(prompt.tag_ids)).all()
            db_prompt.tags = tags
            db.commit()
        
        prompt = db.query(Prompt).options(joinedload(Prompt.category), joinedload(Prompt.tags)).filter(Prompt.id == db_prompt.id).first()
        return prompt
    finally:
        db.close()


@app.put("/prompts/{prompt_id}", response_model=PromptResponse)
def update_prompt(prompt_id: int, prompt: PromptUpdate):
    db = SessionLocal()
    try:
        db_prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not db_prompt:
            return {"error": "Prompt not found"}
        
        if prompt.title is not None:
            db_prompt.title = prompt.title
        if prompt.content is not None:
            db_prompt.content = prompt.content
        if prompt.category_id is not None:
            db_prompt.category_id = prompt.category_id
        if prompt.tag_ids is not None:
            tags = db.query(Tag).filter(Tag.id.in_(prompt.tag_ids)).all()
            db_prompt.tags = tags
        
        db.commit()
        result = db.query(Prompt).options(joinedload(Prompt.category), joinedload(Prompt.tags)).filter(Prompt.id == prompt_id).first()
        return result
    finally:
        db.close()


@app.delete("/prompts/{prompt_id}")
def delete_prompt(prompt_id: int):
    db = SessionLocal()
    try:
        prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if prompt:
            db.delete(prompt)
            db.commit()
            return {"message": "Prompt deleted"}
        return {"error": "Prompt not found"}
    finally:
        db.close()


@app.post("/prompts/{prompt_id}/copy")
def copy_prompt(prompt_id: int):
    db = SessionLocal()
    try:
        original = db.query(Prompt).options(joinedload(Prompt.tags)).filter(Prompt.id == prompt_id).first()
        if not original:
            return {"error": "Prompt not found"}
        
        new_prompt = Prompt(
            title=f"{original.title} (副本)",
            content=original.content,
            category_id=original.category_id
        )
        db.add(new_prompt)
        db.commit()
        db.refresh(new_prompt)
        
        tag_ids = [t.id for t in original.tags]
        if tag_ids:
            tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
            new_prompt.tags = tags
            db.commit()
        
        result = db.query(Prompt).options(joinedload(Prompt.category), joinedload(Prompt.tags)).filter(Prompt.id == new_prompt.id).first()
        return result
    finally:
        db.close()
