# O2C Synthetic Data Generator

Generates realistic, mathematically consistent Order-to-Cash transactional graphs with controlled, benchmark-labeled anomaly injections.

## Package Architecture

- `src/datagen/config/`: Generation settings, scale factors, seeds.
- `src/datagen/schema/`: Pydantic data models enforcing database column types.
- `src/datagen/generators/`: Discrete entity generators (accounts, quotes, orders, shipments, invoices, payments).
- `src/datagen/anomalies/`: Perturbation logic injecting revenue leakage and delay defects.
- `src/datagen/derive/`: Dependent state and milestone calculation helpers.
- `src/datagen/validate/`: Post-generation referential integrity and constraint checks.
- `src/datagen/export/`: CSV, JSON, and Parquet serializers.
- `src/datagen/loader/`: Direct bulk insertion into Supabase / PostgreSQL.

