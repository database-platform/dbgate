const { DatabaseAnalyser } = require('dbgate-tools');
const sql = require('./sql');
const _ = require('lodash');

class Analyser extends DatabaseAnalyser {
  constructor(connection, driver, version) {
    super(connection, driver, version);
    console.log('connection :', connection, driver, version);
  }

  createQuery(resFileName, typeFields) {
    console.log('createQuery :', this.singleObjectFilter);
    let res = sql[resFileName];
    // res = res.replace('#SCHEMA_NAME#', this.connection._database_name);
    const query = super.createQuery(res, typeFields);
    console.log('createQuery :', query);
    return query;
  }

  async _computeSingleObjectId() {
    const { pureName } = this.singleObjectFilter;
    this.singleObjectId = pureName;
    console.log('_computeSingleObjectId :', this.singleObjectId);
  }

  async _runAnalysis() {
    this.feedback({ analysingMessage: 'Loading tables' });
    const tables = await this.analyserQuery(this.driver.dialect.stringAgg ? 'tableList' : 'tableList', ['tables']);
    console.log('tables', tables);
    this.feedback({ analysingMessage: 'Loading columns' });
    // const columns = await this.analyserQuery('columns', ['tables', 'views']);
    // console.log('columns', columns);
    // return structure as DatabaseInfo (https://github.com/dbgate/dbgate/blob/master/packages/types/dbinfo.d.ts)
    return {
      tables: tables.rows.map((table) => {
        const newTable = {
          pureName: table.pure_name,
          schemaName: table.schema_name,
          objectId: `tables:${table.schema_name}.${table.pure_name}`,
          contentHash: table.hash_code_columns ? `${table.hash_code_columns}-${table.hash_code_constraints}` : null,
        };
        return {
          ...newTable,
        };
      })
      /*[
        {
          objectId: 'table1',
          pureName: 't1',
          columns: [
            {
              columnName: 'c1',
            },
          ],
        },
      ],*/
    };
  }
}

module.exports = Analyser;
