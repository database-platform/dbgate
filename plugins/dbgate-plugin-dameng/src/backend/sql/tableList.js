module.exports = `
  select
    -- owner "schema_name",                             
    table_name "pure_name"
  from
    all_tables
  where OWNER ='$owner' and 'tables:' || TABLE_NAME =OBJECT_ID_CONDITION
`;
