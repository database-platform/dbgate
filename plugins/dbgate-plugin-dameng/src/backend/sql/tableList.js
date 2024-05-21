module.exports = `
  select
    owner "schema_name",                             
    table_name "pure_name"
  from
    all_tables
  where OWNER ='#SCHEMA_NAME#' and OWNER =OBJECT_ID_CONDITION
`;