# Benchmark: Error handling with propagation
from dataclasses import dataclass
from typing import Union, Generic, TypeVar

T = TypeVar("T")

@dataclass
class Ok(Generic[T]):
    value: T

@dataclass
class Err:
    error: str

Result = Union[Ok[T], Err]

def parse_age(s: str) -> Result:
    try:
        n = int(s)
    except ValueError:
        return Err(f"Not a number: {s}")
    if n < 0:   return Err(f"Age cannot be negative: {n}")
    if n > 150: return Err(f"Unlikely age: {n}")
    return Ok(n)

@dataclass
class User:
    name: str
    age:  int

def validate_user(name: str, age_str: str) -> Result:
    if not name: return Err("Name cannot be empty")
    result = parse_age(age_str)
    if isinstance(result, Err): return result
    return Ok(User(name=name, age=result.value))

def process(name: str, age_str: str) -> str:
    result = validate_user(name, age_str)
    if isinstance(result, Ok):
        return f"Valid: {result.value.name}, age {result.value.age}"
    return f"Error: {result.error}"

print(process("Alice", "30"))
print(process("Bob",   "abc"))
print(process("",      "25"))
print(process("Diana", "-5"))
print(process("Eve",   "200"))
