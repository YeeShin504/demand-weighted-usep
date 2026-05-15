# Demand-Weighted USEP

The Uniform Singapore Energy Price (USEP) is the wholesale electricity price in Singapore’s National Electricity Market (NEMS). It is determined every half-hour in the Singapore Wholesale Electricity Market (SWEM) and reflects prevailing supply-demand conditions in the power system.

USEP is influenced by factors including:

- electricity demand,
- generation availability,
- fuel costs,
- transmission constraints, and
- broader market conditions.

Since the commencement of the NEMS in 2003, USEP has served as a key benchmark for Singapore’s electricity market. The Energy Market Authority (EMA) publishes [monthly average USEP statistics](https://www.ema.gov.sg/resources/statistics/average-monthly-uniform-singapore-energy-price), calculated as a simple arithmetic average of half-hourly USEP values over each month.

However, a simple average does not account for variations in electricity demand throughout the day. As a result, it may not accurately reflect the effective average cost of electricity consumption under actual demand conditions.

More granular half-hourly USEP data is publicly available through the [NEMS Data Portal](https://www.nems.emcsg.com/nems-prices), although access is limited to a rolling five-year period.

This repository aims to:

- calculate a demand-weighted USEP using half-hourly demand data,
- archive granular historical USEP data beyond the rolling availability window, and
- provide datasets for long-term analysis and research on Singapore’s electricity market.

---

## Methodology

The demand-weighted USEP is calculated as:

\[
\text{DW-USEP} = \frac{\sum \limits*{t=1}^{48} P_t D_t}{\sum \limits*{t=1}^{48} D_t}
\]

where:

- \(P_t\) = half-hourly USEP,
- \(D_t\) = half-hourly electricity demand,
- \(t\) = settlement interval. A day is divided into 48 half-hourly intervals.

This weighting approach gives greater influence to periods with higher electricity consumption and produces a metric that is more representative of the average cost of electricity under actual demand conditions.

---

## RUSEP

In July 2023, the EMA introduced the Temporary Price Cap (TPC) as a circuit breaker mechanism to mitigate extreme price volatility in the SWEM (due to an energy crisis). This is triggered when the moving average price exceeds the three times prevailing long-run marginal cost (LRMC) of electricity for a sustained period.

When the TPC is active, observed USEP values are capped at the prevailing TPC level. During these periods, the EMA also publishes the Reference Uniform Singapore Energy Price (RUSEP), which represents the uncapped USEP that would have prevailed in the absence of the TPC.

This repository also computes a demand-weighted RUSEP to provide a more representative measure of wholesale electricity prices during TPC periods.

---

## Data Sources

Primary data sources:

- NEMS Data Portal: https://www.nems.emcsg.com/nems-prices
- EMA Monthly USEP Statistics: https://www.ema.gov.sg/resources/statistics/average-monthly-uniform-singapore-energy-price

---

## Disclaimer

This repository is an independent archival and analytical project and is not affiliated with:

- the Energy Market Authority (EMA),
- the Energy Market Company (EMC), or
- the National Electricity Market of Singapore (NEMS).

All official market data and market rules remain the property of their respective owners.
