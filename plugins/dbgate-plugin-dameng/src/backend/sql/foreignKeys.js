module.exports = `
select  fk.constraint_name as "constraint_name",
  -- fk.owner as "constraint_schema",
  fk.table_name as "pure_name",
  -- fk.owner as "schema_name",
  fk.delete_rule as "update_action",
  fk.delete_rule as "delete_action",
  aref.table_name as "ref_table_name",
  -- aref.owner as "ref_schema_name",
  basecol.column_name as "column_name",
  refcol.column_name as "ref_column_name"
from all_cons_columns refcol, all_cons_columns basecol, all_constraints aref, all_constraints fk
where fk.OWNER = '$owner' AND fk.constraint_type = 'R'
and aref.owner = fk.r_owner
and aref.constraint_name = fk.r_constraint_name
and basecol.owner = fk.owner
and basecol.constraint_name = fk.constraint_name
and basecol.table_name = fk.table_name
and refcol.owner = aref.owner
and refcol.constraint_name = aref.constraint_name
and refcol.table_name = aref.table_name
AND 'tables:' || fk.table_name =OBJECT_ID_CONDITION
order by basecol.position
`;
