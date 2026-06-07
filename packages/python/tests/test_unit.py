import pytest

from taiwan_payroll import (
    get_available_years,
    get_year_data,
    create_payroll_engine,
    CalculateInput,
    SupplementaryInput,
    ProratedInput,
    EmployerSupplementaryInput,
    WithholdingInput,
)
from taiwan_payroll.engine.employer_supplementary import calc_employer_supplementary
from taiwan_payroll.engine.withholding import calc_withholding
from taiwan_payroll._rounding import (
    round_half_up,
    ceil_div,
    parse_rate,
    apply_rate,
    apply_rate_prorated,
    number_to_rate_string,
)
from taiwan_payroll._lookup import find_bracket
from taiwan_payroll.engine.labor import calc_labor_insurance
from taiwan_payroll.engine.health import calc_health_insurance
from taiwan_payroll.engine.pension import calc_pension
from taiwan_payroll.engine.occupational import calc_occupational
from taiwan_payroll.engine.supplementary import calc_supplementary, calc_dividend_premium
from taiwan_payroll.engine.prorated import compute_insured_days, health_charged_this_month, calc_prorated

D = get_year_data(2026)


# --- data loader ---
def test_available_years():
    assert get_available_years() == [2024, 2025, 2026]


def test_year_data_metadata():
    assert D["dataVersion"] == "2026.1.0"
    assert D["minimumWage"] == {"monthly": 29500, "hourly": 196}


def test_unknown_year_raises():
    with pytest.raises(ValueError, match="year"):
        get_year_data(1999)


# --- rounding ---
def test_round_half_up():
    assert round_half_up(7375, 10) == 738
    assert round_half_up(6785, 10) == 679
    assert round_half_up(4576, 10) == 458


def test_ceil_div():
    assert ceil_div(7371, 10) == 738
    assert ceil_div(7380, 10) == 738


def test_parse_rate():
    assert parse_rate("0.0517") == (517, 10000)
    assert parse_rate("0.125") == (125, 1000)
    with pytest.raises(ValueError, match="Invalid rate"):
        parse_rate("1e-8")


def test_number_to_rate_string():
    assert number_to_rate_string(0.0021) == "0.0021000000"
    assert number_to_rate_string(0.06) == "0.0600000000"
    assert number_to_rate_string(1e-8) == "0.0000000100"


def test_apply_rate():
    assert apply_rate(29500, ["0.125", "0.2"]) == 738
    assert apply_rate(29500, ["0.0517", "0.3"]) == 458
    assert apply_rate(42000, ["0.0517", "0.6", "1.56"]) == 2032
    assert apply_rate(29500, [number_to_rate_string(0.0021)]) == 62


def test_apply_rate_prorated():
    assert apply_rate_prorated(36300, ["0.06"], 6) == 436
    assert apply_rate_prorated(48200, ["0.06"], 27) == 2603
    assert apply_rate_prorated(29500, ["0.125", "0.2"], 23) == 565
    assert apply_rate_prorated(29500, ["0.125", "0.2"], 30) == 738


# --- lookup ---
def test_find_bracket():
    brackets = [
        {"grade": 1, "min": 0, "max": 29500, "insuredSalary": 29500},
        {"grade": 2, "min": 29501, "max": 30300, "insuredSalary": 30300},
        {"grade": 3, "min": 30301, "max": None, "insuredSalary": 45800},
    ]
    assert find_bracket(brackets, 30000)["insuredSalary"] == 30300
    assert find_bracket(brackets, 29500)["insuredSalary"] == 29500
    assert find_bracket(brackets, 20000)["insuredSalary"] == 29500
    assert find_bracket(brackets, 999999)["insuredSalary"] == 45800


# --- engines ---
def test_labor():
    r = calc_labor_insurance(D, 29500, True, "round")
    assert (r["insured"], r["employee"], r["employer"], r["government"]) == (29500, 738, 2581, 369)
    assert calc_labor_insurance(D, 29500, False, "round")["employee"] == 679
    agg = calc_labor_insurance(D, 31800, True, "aggregate-then-round")
    assert (agg["employee"], agg["employer"], agg["government"]) == (795, 2783, 397)


def test_health():
    r = calc_health_insurance(D, 29500, 0, "round")
    assert (r["employee"], r["employer"], r["government"]) == (458, 1428, 238)
    assert calc_health_insurance(D, 42000, 1, "round")["employee"] == 1302
    assert calc_health_insurance(D, 42000, 1.7, "round")["employee"] == 1302


def test_pension():
    assert calc_pension(D, 42000, 0, "round")["employer"] == 2520
    assert calc_pension(D, 42000, 0.06, "round")["self"] == 2520
    assert calc_pension(D, 200000, 0, "round")["insured"] == 150000


def test_occupational():
    assert calc_occupational(D, 29500, "0.0021", "round")["employer"] == 62
    assert calc_occupational(D, 200000, "0.0021", "round")["employer"] == 153


def test_supplementary():
    r = calc_supplementary(D, SupplementaryInput(type="bonus", amount=200000, monthly_insured_salary=42000), "round")
    assert r.chargeable == 32000 and r.premium == 675
    assert calc_supplementary(D, SupplementaryInput(type="dividend", amount=50000), "round").premium == 1055
    assert calc_supplementary(D, SupplementaryInput(type="dividend", amount=19999), "round").chargeable == 0
    cap = calc_supplementary(D, SupplementaryInput(type="dividend", amount=12000000), "round")
    assert (cap.chargeable, cap.premium) == (10000000, 211000)
    with pytest.raises(ValueError, match="monthlyInsuredSalary"):
        calc_supplementary(D, SupplementaryInput(type="bonus", amount=100000), "round")


def test_calc_dividend_premium():
    d = get_year_data(2026)
    assert calc_dividend_premium(d, 25620) == 541
    assert calc_dividend_premium(d, 20000) == 422
    assert calc_dividend_premium(d, 19999) == 0
    assert calc_dividend_premium(d, 3000000, 2184000) == 17218


def test_supplementary_returns_ints_even_for_float_inputs():
    r = calc_supplementary(D, SupplementaryInput(type="dividend", amount=50000.0), "round")
    assert r.chargeable == 50000 and r.premium == 1055
    assert isinstance(r.chargeable, int) and isinstance(r.premium, int)


def test_prorated_days():
    assert compute_insured_days("2026-03-08", None) == 23
    assert compute_insured_days(None, "2026-03-08") == 8
    assert compute_insured_days("2026-02-03", "2026-02-18") == 16
    assert compute_insured_days("2026-01-31", None) == 1
    assert health_charged_this_month("2026-03-08", None) is True
    assert health_charged_this_month(None, "2026-03-08") is False
    with pytest.raises(ValueError, match="startDate or endDate"):
        compute_insured_days(None, None)
    with pytest.raises(ValueError, match="same month"):
        compute_insured_days("2026-01-10", "2026-02-10")
    with pytest.raises(ValueError, match="YYYY-MM-DD"):
        compute_insured_days("2026-3-8", None)


def test_prorated():
    r = calc_prorated(D, ProratedInput(monthly_salary=36300, start_date="2026-02-25"), "0.0021")
    assert r.employer.pension == 436
    r2 = calc_prorated(D, ProratedInput(monthly_salary=29500, end_date="2026-03-08"), "0.0021")
    assert r2.health_charged is False and r2.employee.health == 0 and r2.employee.labor == 197


# --- public engine ---
def test_engine_full_result():
    e = create_payroll_engine(2026)
    r = e.calculate(CalculateInput(monthly_salary=42000, dependents=1, pension_self_contribution=0.06))
    assert (r.brackets.labor, r.brackets.occupational) == (42000, 42000)
    assert (r.employee.labor, r.employee.health, r.employee.pension_self) == (1050, 1302, 2520)
    assert (r.employer.labor, r.employer.occupational, r.employer.total) == (3675, 88, 3675 + 2032 + 2520 + 88)
    assert r.government.labor == 525
    assert (r.meta.year, r.meta.data_version) == (2026, "2026.1.0")


def test_engine_validation():
    e = create_payroll_engine(2026)
    with pytest.raises(ValueError, match="monthlySalary"):
        e.calculate(CalculateInput(monthly_salary=-1))
    with pytest.raises(ValueError, match="identity"):
        e.calculate(CalculateInput(monthly_salary=29500, identity="category2"))  # type: ignore[arg-type]
    with pytest.raises(ValueError, match="occupationalRate"):
        e.calculate(CalculateInput(monthly_salary=29500, occupational_rate=0.89))
    assert e.calculate(CalculateInput(monthly_salary=29500, occupational_rate=0.0089)).employer.occupational == 263
    # bool must be rejected like JS Number.isFinite(true) === false
    with pytest.raises(ValueError, match="monthlySalary"):
        e.calculate(CalculateInput(monthly_salary=True))  # type: ignore[arg-type]


def test_engine_prorated_and_supplementary():
    e = create_payroll_engine(2026)
    pr = e.calculate_prorated(ProratedInput(monthly_salary=29500, start_date="2026-03-08"))
    assert pr.days.insured == 23 and pr.health_charged is True and pr.employee.labor == 565
    sp = e.calculate_supplementary(SupplementaryInput(type="bonus", amount=200000, monthly_insured_salary=42000))
    assert sp.premium == 675


def test_part_time():
    e = create_payroll_engine(2026)
    pt = e.calculate(CalculateInput(monthly_salary=15000, part_time=True))
    # 勞保/健保 -> 15,840 低級距；職保無低級距 -> 29,500
    assert (pt.brackets.labor, pt.brackets.health, pt.brackets.occupational) == (15840, 15840, 29500)
    assert pt.employee.labor == 396
    assert e.calculate(CalculateInput(monthly_salary=5000, part_time=True)).brackets.labor == 11100
    assert e.calculate(CalculateInput(monthly_salary=29000, part_time=True)).brackets.labor == 29500
    assert e.calculate(CalculateInput(monthly_salary=35000, part_time=True)).brackets.labor == 36300
    # regression: no flag -> floor to grade 1
    assert e.calculate(CalculateInput(monthly_salary=15000)).brackets.labor == 29500
    # prorated honours part_time
    prr = e.calculate_prorated(ProratedInput(monthly_salary=15000, start_date="2026-03-08", part_time=True))
    assert prr.brackets.labor == 15840 and prr.brackets.occupational == 29500


def test_foreign_identities():
    e = create_payroll_engine(2026)
    g = e.calculate(CalculateInput(monthly_salary=30000, identity="migrantGeneral"))
    assert g.brackets.labor == 30300 and g.employee.labor == 697 and g.government.labor == 348
    assert g.brackets.pension == 0 and g.employer.pension == 0 and g.employee.pension_self == 0
    assert g.employee.health == 470 and g.employer.occupational == 64
    # forced 11.5% even with employment_insurance=True
    assert e.calculate(CalculateInput(monthly_salary=30000, identity="migrantGeneral", employment_insurance=True)).employee.labor == 697
    d = e.calculate(CalculateInput(monthly_salary=30000, identity="migrantDomestic", occupational_rate=0.0018))
    assert d.brackets.labor == 0 and d.employee.labor == 0 and d.government.labor == 0
    assert d.employer.pension == 0 and d.employee.health == 470 and d.employer.occupational == 55
    pr = e.calculate_prorated(ProratedInput(monthly_salary=30000, start_date="2026-03-08", identity="migrantDomestic", occupational_rate=0.0018))
    assert pr.employee.labor == 0 and pr.employer.pension == 0 and pr.employee.health > 0
    with pytest.raises(ValueError, match="identity"):
        e.calculate(CalculateInput(monthly_salary=29500, identity="category9"))  # type: ignore[arg-type]
    # migrant pension stays 0 even if pension_self_contribution is set
    g2 = e.calculate(CalculateInput(monthly_salary=30000, identity="migrantGeneral", pension_self_contribution=0.06))
    assert g2.employee.pension_self == 0 and g2.employer.pension == 0
    # prorated validates occupationalRate range
    with pytest.raises(ValueError, match="occupationalRate"):
        e.calculate_prorated(ProratedInput(monthly_salary=30000, start_date="2026-03-08", occupational_rate=0.89))


def test_employer_supplementary():
    r = calc_employer_supplementary(D, EmployerSupplementaryInput(monthly_paid_total=5_000_000, monthly_insured_total=4_200_000), "round")
    assert r.base == 800_000
    assert r.rate == "0.0211"
    assert r.premium == 16_880
    # 投保總額≥薪資總額 → 0
    z = calc_employer_supplementary(D, EmployerSupplementaryInput(monthly_paid_total=4_000_000, monthly_insured_total=4_200_000), "round")
    assert z.base == 0 and z.premium == 0


def test_employer_supplementary_validation():
    import pytest
    with pytest.raises(ValueError):
        calc_employer_supplementary(D, EmployerSupplementaryInput(monthly_paid_total=-1, monthly_insured_total=0), "round")
    with pytest.raises(ValueError):
        calc_employer_supplementary(D, EmployerSupplementaryInput(monthly_paid_total=0, monthly_insured_total=-1), "round")


def test_employer_supplementary_engine_method():
    eng = create_payroll_engine(2026)
    assert eng.calculate_employer_supplementary(EmployerSupplementaryInput(monthly_paid_total=5_000_000, monthly_insured_total=4_200_000)).premium == 16_880


def test_withholding_resident():
    r = calc_withholding(D, WithholdingInput(type="resident", monthly_salary=60000))
    assert r.withholding == 500 and r.rate == "0.05" and r.taxable_annual == 120000
    assert calc_withholding(D, WithholdingInput(type="resident", monthly_salary=100000, dependents=2)).withholding == 1658
    assert calc_withholding(D, WithholdingInput(type="resident", monthly_salary=50000)).withholding == 0


def test_withholding_bonus_and_nonresident():
    assert calc_withholding(D, WithholdingInput(type="residentBonus", amount=100000)).withholding == 5000
    assert calc_withholding(D, WithholdingInput(type="residentBonus", amount=90000)).withholding == 0
    assert calc_withholding(D, WithholdingInput(type="nonResident", monthly_salary=40000)).withholding == 2400
    assert calc_withholding(D, WithholdingInput(type="nonResident", monthly_salary=50000)).withholding == 9000


def test_withholding_validation_and_missing():
    import pytest
    with pytest.raises(ValueError):
        calc_withholding(D, WithholdingInput(type="resident", monthly_salary=-1))
    no_tax = {k: v for k, v in D.items() if k != "incomeTax"}
    with pytest.raises(ValueError):
        calc_withholding(no_tax, WithholdingInput(type="resident", monthly_salary=60000))


def test_withholding_engine_method():
    assert create_payroll_engine(2026).calculate_withholding(WithholdingInput(type="resident", monthly_salary=60000)).withholding == 500


from taiwan_payroll import (
    calc_old_age_pension,
    average_highest_insured_salary,
    statutory_claim_age,
    OldAgePensionInput as OAI,
)


def test_old_age_pension_official():
    d = get_year_data(2026)
    r = calc_old_age_pension(d, OAI(avg_insured_salary=32000, years=35, months=6))
    assert (r.formula_a, r.formula_b, r.monthly, r.adjustment_months, r.eligible) == (11804, 17608, 17608, 0, True)
    r2 = calc_old_age_pension(d, OAI(avg_insured_salary=45800, years=40))
    assert (r2.formula_a, r2.formula_b, r2.monthly) == (17198, 28396, 28396)


def test_old_age_pension_adjust_round_eligible():
    d = get_year_data(2026)
    assert calc_old_age_pension(d, OAI(avg_insured_salary=30000, years=15, months=3)).formula_a == 6546
    assert calc_old_age_pension(d, OAI(avg_insured_salary=32000, years=35, months=6, claim_offset_months=-24)).formula_b == 16199
    assert calc_old_age_pension(d, OAI(avg_insured_salary=32000, years=35, months=6, claim_offset_months=-72)).adjustment_months == -60
    assert calc_old_age_pension(d, OAI(avg_insured_salary=30000, years=10)).eligible is False


def test_helpers():
    d = get_year_data(2026)
    assert average_highest_insured_salary([42000, 42000, 36000]) == 40000
    assert statutory_claim_age(d, 50) == 64 and statutory_claim_age(d, 51) == 65
