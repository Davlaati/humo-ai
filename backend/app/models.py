from datetime import datetime
from enum import Enum

from sqlalchemy import BigInteger, Boolean, DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class UserLevel(str, Enum):
    beginner = 'Beginner'
    intermediate = 'Intermediate'
    advanced = 'Advanced'


class TransactionType(str, Enum):
    conversion = 'conversion'
    purchase = 'purchase'


class TransactionStatus(str, Enum):
    pending = 'pending'
    success = 'success'
    failed = 'failed'


class PeriodType(str, Enum):
    weekly = 'weekly'
    monthly = 'monthly'
    overall = 'overall'


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)  # Telegram ID
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    username: Mapped[str | None] = mapped_column(String(64), nullable=True)
    level: Mapped[UserLevel] = mapped_column(SAEnum(UserLevel), default=UserLevel.beginner)
    goal: Mapped[str | None] = mapped_column(String(255), nullable=True)
    interests: Mapped[list[str]] = mapped_column(ARRAY(String(64)), default=list)
    coins: Mapped[int] = mapped_column(Integer, default=0)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    streak_freeze_count: Mapped[int] = mapped_column(Integer, default=0)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    telegram_stars: Mapped[int] = mapped_column(Integer, default=0)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    last_active: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    last_rewarded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    transactions: Mapped[list['Transaction']] = relationship(back_populates='user', cascade='all, delete-orphan')
    words: Mapped[list['WordBank']] = relationship(back_populates='user', cascade='all, delete-orphan')


class Transaction(Base):
    __tablename__ = 'transactions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey('users.id', ondelete='CASCADE'), index=True)
    type: Mapped[TransactionType] = mapped_column(SAEnum(TransactionType), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(16), default='stars')
    status: Mapped[TransactionStatus] = mapped_column(SAEnum(TransactionStatus), default=TransactionStatus.pending)
    provider_charge_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    user: Mapped[User] = relationship(back_populates='transactions')


class WordBank(Base):
    __tablename__ = 'word_bank'
    __table_args__ = (UniqueConstraint('user_id', 'word', name='uq_word_per_user'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey('users.id', ondelete='CASCADE'), index=True)
    word: Mapped[str] = mapped_column(String(128), nullable=False)
    translation: Mapped[str] = mapped_column(String(255), nullable=False)
    mastered: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[User] = relationship(back_populates='words')
