"""
Nigeria Market Viability Evaluation Engine for Reva (Flow 2a / Shared Pipeline).
Assesses venture ideas against 6 core Nigerian market dimensions:
1. Demand and Affordability
2. Regulation & Licensing
3. Infrastructure & Payment Rails
4. Competition & White Space
5. Unit Economics & FX Resilience
6. Distribution & Local Trust

Keeps ideas rated Medium or High; parks ideas rated Low.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from src.parsers.doc_parser import IdeaBrief
from src.utils.llm_client import llm_client


class ViabilityDimension(BaseModel):
    dimension: str
    rating: str = Field(description="High | Medium | Low")
    rationale: str
    key_risk_or_enabler: str


class ViabilityAssessment(BaseModel):
    overall_rating: str = Field(description="High | Medium | Low")
    status: str = Field(description="'passed' (if High or Medium) | 'parked_below_viability' (if Low)")
    score_percentage: float = Field(description="Estimated viability percentage 0 to 100")
    dimensions: List[ViabilityDimension]
    executive_verdict: str
    key_regulatory_bodies: List[str]
    critical_infrastructure_dependency: str


VIABILITY_EVALUATION_PROMPT = """You are a seasoned Nigerian venture architect evaluating local market viability for Trium Limited.
Test this venture concept against the 6 core Nigerian market realities:

CONCEPT DETAILS:
Name: {name}
Sector: {sector}
Description: {description}
Problem: {problem}
Solution: {solution}
Target Customer: {targetCustomer}
Monetization: {monetization}
Distribution / GTM: {goToMarket}

EVALUATION DIMENSIONS:
1. Demand and affordability: Is there a paying customer in Nigeria, and does the price point work at current local household/business disposable incomes?
2. Regulation: Which regulators apply (e.g. CBN, SEC, NCC, NITDA, FCCPC, NAFDAC, NERC) and is there a viable licensing or regulatory sandbox path?
3. Infrastructure and payments: Does it depend on power, connectivity, identity (NIN/BVN), or payment rails (NIP/USSD) that are reliable in Nigeria?
4. Competition: Who already serves this (formal competitors or informal offline workarounds), and is there room for a differentiated entrant?
5. Unit economics and FX: Do margins survive naira pricing, currency devaluations, and high local delivery/diesel operational costs?
6. Distribution and trust: Can the product reach Nigerian users through existing commercial channels, market associations, or agent networks without excessive CAC?

OVERALL RATING RULES:
- High: Compelling local willingness to pay, manageable regulatory path, resilient to FX, and clear distribution wedge.
- Medium: Viable opportunity but faces 1-2 operational friction points (e.g. licensing delays, infrastructure workarounds needed) that can be engineered around.
- Low: Concept depends on Western assumptions (e.g. high consumer software spend, stable 24/7 power, credit cards) that fail in Nigeria.

Return ONLY a JSON object:
{{
  "overall_rating": "High | Medium | Low",
  "score_percentage": <0-100 float>,
  "executive_verdict": "<3-4 sentence verdict on Nigerian market feasibility>",
  "key_regulatory_bodies": ["<Regulator 1>", "<Regulator 2>"],
  "critical_infrastructure_dependency": "<e.g. Rural GSM, NIP rails, Cold transport>",
  "dimensions": [
    {{
      "dimension": "Demand and Affordability",
      "rating": "High | Medium | Low",
      "rationale": "...",
      "key_risk_or_enabler": "..."
    }},
    {{
      "dimension": "Regulation",
      "rating": "High | Medium | Low",
      "rationale": "...",
      "key_risk_or_enabler": "..."
    }},
    {{
      "dimension": "Infrastructure and Payments",
      "rating": "High | Medium | Low",
      "rationale": "...",
      "key_risk_or_enabler": "..."
    }},
    {{
      "dimension": "Competition",
      "rating": "High | Medium | Low",
      "rationale": "...",
      "key_risk_or_enabler": "..."
    }},
    {{
      "dimension": "Unit Economics and FX",
      "rating": "High | Medium | Low",
      "rationale": "...",
      "key_risk_or_enabler": "..."
    }},
    {{
      "dimension": "Distribution and Trust",
      "rating": "High | Medium | Low",
      "rationale": "...",
      "key_risk_or_enabler": "..."
    }}
  ]
}}"""


class ViabilityEvaluator:
    """Evaluates Nigerian market feasibility across 6 structural dimensions."""

    def evaluate_viability(self, brief: IdeaBrief) -> ViabilityAssessment:
        prompt = VIABILITY_EVALUATION_PROMPT.format(
            name=brief.name,
            sector=brief.sector or "Tech",
            description=brief.description,
            problem=brief.problem,
            solution=brief.solution,
            targetCustomer=brief.targetCustomer,
            monetization=brief.monetization or "To be determined",
            goToMarket=brief.goToMarket or "Direct distribution"
        )

        try:
            data = llm_client.generate_json(prompt)
            required = {"overall_rating", "score_percentage", "executive_verdict", "key_regulatory_bodies", "critical_infrastructure_dependency", "dimensions"}
            if not isinstance(data, dict) or not required.issubset(data) or len(data["dimensions"]) < 6:
                raise RuntimeError("The LLM provider returned an incomplete viability assessment.")

            rating = str(data["overall_rating"]).capitalize()
            if rating not in ["High", "Medium", "Low"]:
                rating = "Medium"

            status = "passed" if rating in ["High", "Medium"] else "parked_below_viability"

            return ViabilityAssessment(
                overall_rating=rating,
                status=status,
                score_percentage=float(data["score_percentage"]),
                executive_verdict=data["executive_verdict"],
                key_regulatory_bodies=data["key_regulatory_bodies"],
                critical_infrastructure_dependency=data["critical_infrastructure_dependency"],
                dimensions=[ViabilityDimension(**d) for d in data["dimensions"]]
            )
        except Exception as e:
            raise RuntimeError(f"Viability assessment failed: {e}") from e



viability_evaluator = ViabilityEvaluator()
