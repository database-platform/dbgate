module.exports = `
select avv.*,
  ORA_HASH("create_sql") as "hash_code"
from (select
  view_name as "pure_name",
  -- owner as "schema_name",
  SUBSTRING(text, 1, 3900) AS "create_sql"
  from all_views av
  where owner = '$owner' and text is not null
  ) avv
  where 'views:' || "pure_name" =OBJECT_ID_CONDITION
`;
