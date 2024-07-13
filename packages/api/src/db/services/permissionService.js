const { DatabaseAuth } = require('../models');

class PermissionService {
  async findDatbase(group_id, db_id, schema, type) {
    return this.find({ group_id, db_id, type: 'database' });
  }

  // type: table, view, procedure, function
  async findStructure(group_id, db_id, schema, type) {
    return this.find({ group_id, db_id, schema, type });
  }

  async findColumn(group_id, db_id, schema, tname) {
    return this.find({ group_id, db_id, schema, tname, type: 'column' });
  }

  async find(where) {
    console.log('permission find ', where);
    try {
      const permissions = await DatabaseAuth.findAll({
        where,
      });
      return permissions?.map(p => p.get({ plain: true }));
    } catch (error) {
      console.error(error);
    }
    return [];
  }
}

module.exports = PermissionService;
