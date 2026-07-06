# Benchmark: Pattern matching on tagged union types
from dataclasses import dataclass
from typing import Union
import math

@dataclass
class Circle:
    radius: float

@dataclass
class Rect:
    width:  float
    height: float

@dataclass
class Triangle:
    base:   float
    height: float

Shape = Union[Circle, Rect, Triangle]

def area(s: Shape) -> float:
    match s:
        case Circle(radius=r):
            return math.pi * r * r
        case Rect(width=w, height=h):
            return w * h
        case Triangle(base=b, height=h):
            return 0.5 * b * h

def describe(s: Shape) -> str:
    match s:
        case Circle(radius=r) if r > 10:
            return "large circle"
        case Circle():
            return "small circle"
        case Rect(width=w, height=h):
            return f"rectangle {w}x{h}"
        case Triangle():
            return "triangle"

shapes: list[Shape] = [
    Circle(5.0), Circle(15.0),
    Rect(4.0, 6.0), Rect(10.0, 3.0),
    Triangle(8.0, 5.0),
]

for s in shapes:
    print(f"{describe(s)} — area: {area(s)}")
