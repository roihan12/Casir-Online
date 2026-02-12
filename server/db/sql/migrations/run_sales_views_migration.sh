#!/bin/bash
# Script to run sales report view migration
# Usage: bash run_sales_views_migration.sh

echo "🚀 Running Sales Report Views Migration..."
echo "============================================"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found. Please install PostgreSQL client."
    exit 1
fi

# Load environment variables (adjust path as needed)
if [ -f "../../.env" ]; then
    export $(cat ../../.env | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: .env file not found. Using environment variables..."
fi

# Execute the migration
echo "📝 Creating materialized view and regular view..."
psql $DATABASE_URL -f create_sales_report_views.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📊 Next steps:"
    echo "1. Refresh materialized view: SELECT refresh_sales_materialized_view();"
    echo "2. Test queries: Check examples in the SQL file"
    echo "3. Set up cron job for daily refresh (optional)"
    echo ""
    echo "🎯 Views created:"
    echo "   - mv_sales_daily_summary (Materialized View)"
    echo "   - v_sales_report (Regular View)"
    echo "   - Function: get_sales_summary()"
    echo "   - Function: refresh_sales_materialized_view()"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
