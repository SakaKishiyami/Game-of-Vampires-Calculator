# STA 431/531 Homework 2 Solutions

## Problem 1: Ohio Exit Poll Analysis

### Given Data:
- Total Ohio residents polled: n = 2020
- Number who voted for Bush: x = 1030

### (a) i. Proportion who voted for Bush
p̂ = x/n = 1030/2020 = **0.510**

### (a) ii. Null Model Specification
- **H₀: p = 0.5** (Bush would NOT carry Ohio - no majority)
- **H₁: p > 0.5** (Bush WOULD carry Ohio - has majority)

### (a) iii. Simulation and P-value
Using binomial distribution with n = 2020, p = 0.5 under null hypothesis:

**Exact p-value calculation:**
p-value = P(X ≥ 1030 | p = 0.5) = 1 - P(X ≤ 1029 | p = 0.5)

Using normal approximation:
- μ = np = 2020 × 0.5 = 1010
- σ = √(np(1-p)) = √(2020 × 0.5 × 0.5) = √505 ≈ 22.47

z = (1030 - 1010)/22.47 = 20/22.47 ≈ 0.890

p-value ≈ P(Z ≥ 0.890) = 1 - Φ(0.890) ≈ 1 - 0.813 = **0.187**

**Result:** It is NOT surprising to find 1030 out of 2020 Ohio residents voted for Bush. The p-value is approximately **0.187**, which is greater than 0.05, so the result is **NOT statistically significant**.

### (a) iv. Confidence Intervals

**95% CI (5% rejection standard):**
- z₀.₀₂₅ = 1.96
- SE = √(p̂(1-p̂)/n) = √(0.510 × 0.490/2020) = √0.000124 = 0.0111
- 95% CI = 0.510 ± 1.96 × 0.0111 = [0.488, 0.532]

**99% CI (1% rejection standard):**
- z₀.₀₀₅ = 2.576
- 99% CI = 0.510 ± 2.576 × 0.0111 = [0.481, 0.539]

### (b) Formal Hypothesis Test (4C's)

**Context:** Testing whether Bush would carry Ohio based on exit poll data

**Conditions:** 
- n × p̂ = 2020 × 0.510 = 1030.2 ≥ 10 ✓
- n × (1-p̂) = 2020 × 0.490 = 989.8 ≥ 10 ✓

**Calculation:**
- Test statistic: z = (p̂ - 0.5)/√(0.5 × 0.5/n) = (0.510 - 0.5)/√(0.25/2020) = 0.010/0.0111 ≈ 0.901
- p-value ≈ 0.187

**Conclusion:** Fail to reject H₀ at α = 0.05. There is **insufficient evidence** that Bush would carry Ohio.

### (c) 90% Confidence Interval
- z₀.₀₅ = 1.645
- 90% CI = 0.510 ± 1.645 × 0.0111 = [0.492, 0.528]

### (d) R Confirmation
```r
# Hypothesis test
prop.test(1030, 2020, p = 0.5, alternative = "greater")

# 90% confidence interval
prop.test(1030, 2020, conf.level = 0.90)
```

### (e) Type of Error
Since Bush did carry Ohio in 2004, and our test failed to reject H₀ (concluded insufficient evidence), this would be a **Type II error** (failing to reject H₀ when H₁ is true).

---

## Problem 2: Covariance and Variance

### Given:
- Var(X) = 1
- Var(Y) = 4  
- Cov(X,Y) = 1
- U = 2X - 3Y
- V = 3X + 2Y

### (a) Cov(U,V)
Cov(U,V) = Cov(2X-3Y, 3X+2Y)
= Cov(2X,3X) + Cov(2X,2Y) + Cov(-3Y,3X) + Cov(-3Y,2Y)
= 6×Cov(X,X) + 4×Cov(X,Y) - 9×Cov(Y,X) - 6×Cov(Y,Y)
= 6×Var(X) + 4×Cov(X,Y) - 9×Cov(X,Y) - 6×Var(Y)
= 6×1 + 4×1 - 9×1 - 6×4
= 6 + 4 - 9 - 24 = **-23**

### (b) Var(U) and Var(V)

**Var(U) = Var(2X - 3Y)**
= 4×Var(X) + 9×Var(Y) - 2×2×3×Cov(X,Y)
= 4×1 + 9×4 - 12×1 = 4 + 36 - 12 = **28**

**Var(V) = Var(3X + 2Y)**
= 9×Var(X) + 4×Var(Y) + 2×3×2×Cov(X,Y)
= 9×1 + 4×4 + 12×1 = 9 + 16 + 12 = **37**

### (c) ρ(U,V)
ρ(U,V) = Cov(U,V)/√(Var(U) × Var(V))
= -23/√(28 × 37)
= -23/√1036
= -23/32.19 ≈ **-0.715**

---

## Problem 3: Distribution Identification

### (a) Hospital Births
- **X:** Number of births in a given day
- **Distribution:** Poisson
- **Parameter:** λ = 1.8 births/hour × 24 hours = 43.2 births/day
- **PMF:** f(x) = (e^(-43.2) × 43.2^x)/x!
- **Probability:** P(X > 8) = 1 - P(X ≤ 8)

### (b) Cross-fertilization
- **X:** Number of red flowered plants in five offspring
- **Distribution:** Binomial
- **Parameters:** n = 5, p = 0.25
- **PMF:** f(x) = C(5,x) × 0.25^x × 0.75^(5-x)
- **Probability:** P(X = 0) = C(5,0) × 0.25^0 × 0.75^5 = 0.75^5

### (c) Oil Drilling

**i. First strike on third well:**
- **X:** Number of wells drilled until first strike
- **Distribution:** Geometric
- **Parameter:** p = 0.20
- **PMF:** f(x) = (1-p)^(x-1) × p
- **Probability:** P(X = 3) = 0.8^2 × 0.2

**ii. Third strike on seventh well:**
- **X:** Number of wells drilled until third strike
- **Distribution:** Negative Binomial
- **Parameters:** r = 3, p = 0.20
- **PMF:** f(x) = C(x-1, r-1) × p^r × (1-p)^(x-r)
- **Probability:** P(X = 7) = C(6,2) × 0.2^3 × 0.8^4

---

## Problem 4: Maximum Likelihood Estimation (STAT 531 only)

### (a) Hospital Deliveries
- **X:** Number of deliveries between midnight and 8 AM
- **Distribution:** Binomial
- **Parameters:** n = N (total deliveries per year), p = 1/3
- **Observed:** x = 4
- **Likelihood:** L(N) = C(N,4) × (1/3)^4 × (2/3)^(N-4)
- **MLE:** N̂ = 4/(1/3) = **12**

### (b) Telephone Lines
- **X:** Number of busy telephone lines out of 10
- **Distribution:** Binomial
- **Parameters:** n = 10, p = proportion of busy lines
- **Observed:** x = 2
- **Likelihood:** L(p) = C(10,2) × p^2 × (1-p)^8
- **MLE:** p̂ = 2/10 = **0.2**

---

## Summary of Key Results

1. **Problem 1:** p̂ = 0.510, p-value ≈ 0.187, fail to reject H₀
2. **Problem 2:** Cov(U,V) = -23, Var(U) = 28, Var(V) = 37, ρ(U,V) ≈ -0.715
3. **Problem 3:** Identified appropriate distributions for each scenario
4. **Problem 4:** MLE estimators: N̂ = 12, p̂ = 0.2