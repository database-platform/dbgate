const { SqlDumper } = require('dbgate-tools');

class Dumper extends SqlDumper {
  createDatabase(name) {
    console.log('dameng front dumper database: ', name);
    this.putCmd(
      `CREATE USER c##${name}
    IDENTIFIED BY ${name}
    DEFAULT TABLESPACE users
    TEMPORARY TABLESPACE temp
    QUOTA 10M ON users;`,
      name
    );
  }

  columnDefinition(col, options) {
    console.log('dameng front dumper column:', col);
    if (col.autoIncrement) {
      super.columnType(col.dataType);
      this.put(' ^generated ^by ^default ^on ^null ^as ^identity');
      return;
    }
    super.columnDefinition(col, options);
  }
}

module.exports = Dumper;
