# Materialized View Optimization Fixes

This document explains the issues encountered during the materialized view optimization and how they were fixed.

## Issues Encountered

1. **ALTER MATERIALIZED VIEW Error**

   - PostgreSQL doesn't support adding columns to materialized views directly with ALTER TABLE statements
   - Error: `SQL Error [42809]: ERROR: ALTER action ADD COLUMN cannot be performed on relation "mv_financial_daily_trend"`

2. **Syntax Error in View Recreation**
   - Syntax error in the dynamic SQL for recreating views
   - Error: `SQL Error [42601]: ERROR: syntax error at or near ","`

## Solutions Implemented

### 1. View Recreation Approach

Rather than trying to alter existing materialized views, we:

- Drop and recreate each materialized view with the `last_refreshed` column included
- Maintain all original indexes on each view

The solution uses PostgreSQL's `pg_get_viewdef()` function to:

1. Retrieve the original view definition
2. Add the timestamp column to the query
3. Properly recreate the view with its original structure plus the new column

### 2. SQL Syntax Correction

The SQL syntax for recreating materialized views was fixed by:

- Properly parsing the original view definition
- Using a regular expression to insert the timestamp column in the correct position
- Carefully constructing the new view definition with correct SQL syntax
- Separate handling of the query part vs. the DDL (CREATE MATERIALIZED VIEW) part

### 3. Safer Refresh Functions

We also improved the refresh functions to:

- Check if the `last_refreshed` column exists before trying to update it
- Handle views that might not have been upgraded yet
- Provide better error handling and logging

## Implementation Benefits

This implementation:

1. Resolves the limitations of PostgreSQL with respect to modifying materialized views
2. Maintains all the performance benefits of the original optimization strategy
3. Ensures backward compatibility
4. Provides more robust error handling

## How It Works

The key function `add_last_refreshed_to_mv` now:

```sql
CREATE OR REPLACE FUNCTION add_last_refreshed_to_mv(mv_name text)
RETURNS void AS $$
DECLARE
    mv_definition text;
    new_definition text;
    original_query text;
BEGIN
    -- Get the current view definition
    SELECT pg_get_viewdef(mv_name::regclass, true) INTO original_query;

    -- Add the timestamp column to the query
    IF position(' FROM ' in upper(original_query)) > 0 THEN
        new_definition := regexp_replace(
            original_query,
            'FROM',
            ', now() AS last_refreshed FROM',
            'i'  -- case insensitive
        );
    ELSE
        new_definition := original_query || ', now() AS last_refreshed';
    END IF;

    -- Create the full materialized view definition
    mv_definition := 'CREATE MATERIALIZED VIEW ' || mv_name
                     || ' AS ' || new_definition || ' WITH DATA';

    -- Execute the recreation
    EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS ' || mv_name || ' CASCADE';
    EXECUTE mv_definition;

    -- Recreate indexes
    -- ...
END;
$$ LANGUAGE plpgsql;
```

## Deployment Steps

To implement these fixes:

1. Run the updated SQL script in `server/src/sql/optimize_views.sql`
2. Verify that materialized views are recreated with the `last_refreshed` column
3. Check that all indexes are properly recreated
4. Restart the application to activate the view refresh listener service

## Performance Impact

The fixes maintain all the performance improvements of the original optimization:

- POS transaction response times should still be 60-80% faster
- Real-time data for critical operations
- Reduced database load for analytics
