/**
 *
 * sql: select * from xxx
 * parse: from: [
  { db: null, table: 'EMPLOYEES', as: 'e' },
  {
    db: null,
    table: 'TBL_USER',
    as: 't',
    join: 'LEFT JOIN',
    on: [Object]
  }
]
*  result:
*  {
*    columnName: 'xxx',
*    oname: 'xxx',
*    table: 'xx'
*  }
*/
function getColumnsByStar(columns, fieldName, from) {
  const resColumns = [];
  let preIndex = 0;
  let obj;
  columns.map(col => {
    const colName = col[fieldName];
    // e.g. NAME, NAME_1, FIRST_NAME, FIRST_NAME_1
    const lastIndex = colName.lastIndexOf('_');
    if (!obj && lastIndex === -1) {
      obj = from[0];
    } else {
      const asIndex = colName.substring(lastIndex + 1, colName.length);
      // console.log('asIndex ', asIndex);
      if (!isNaN(Number(asIndex))) {
        if (preIndex !== asIndex) {
          obj = from[asIndex];
          preIndex = asIndex;
        }
      }
    }
    // console.log('obj ', obj);
    resColumns.push({
      columnName: colName,
      oname: getOriginColumnName(colName),
      table: obj.table,
    });
  });
  return resColumns;
}

/**
 *  {
 *    columnName: 'xxx',
 *    oname: 'xxx',
 *    table: 'xx'
 *  }
 * */
function getColumnsByDefault(columns, fieldName, from) {
  return columns.map(col => {
    const columnName = col[fieldName];
    return {
      columnName,
      oname: getOriginColumnName(columnName),
      table: from ? getTableNameByStar(from, columnName) : null,
    };
  });
}

// column: { expr: { type: 'column_ref', table: 't', column: 'age' }, as: null }
// from: { db: null, table: 'EMPLOYEES', as: 'e' },
function getTableByAs(from, as) {
  // console.log('as: ', as);
  const find = from.find(item => item.as === as);
  return find ? find.table : from[0].table;
}

/**
 *
 * select * from xxx
 *from: [
  { db: null, table: 'EMPLOYEES', as: 'e' },
  {
    db: null,
    table: 'TBL_USER',
    as: 't',
    join: 'LEFT JOIN',
    on: [Object]
  }
]
name: NAME, NAME_1, FIRST_NAME, FIRST_NAME_1
 */
function getTableNameByStar(from, name) {
  from?.forEach(item => {
    if (name.includes(item.as + '.')) {
      return item.table;
    }
  });
}

// NAME, NAME_1, FIRST_NAME, FIRST_NAME_1
// return NAME, FIRST_NAME
function getOriginColumnName(name) {
  const lastIndex = name.lastIndexOf('_');
  if (lastIndex === -1) {
    return name;
  }
  return name.substring(0, lastIndex);
}
module.exports = {
  getColumnsByStar,
  getColumnsByDefault,
  getTableByAs,
  getTableNameByStar,
  getOriginColumnName,
};
