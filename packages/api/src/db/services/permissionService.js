const { DatabaseAuth, AuthMask, DesensType } = require('../models');

class PermissionService {
  async findDatbase(group_id, db_id) {
    return this.find({ group_id, db_id, type: 'database' });
  }

  async findDatabaseBySchema(group_id, db_id, schema) {
    return this.find({ group_id, db_id, schema, type: 'database' });
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
        include: {
          model: AuthMask,
          include: {
            where: { status: 0 },
            model: DesensType,
            required: false,
          },
        },
      });
      return permissions?.map(p => p.get({ plain: true }));
    } catch (error) {
      console.error(error);
    }
    return [];
  }
}

module.exports = PermissionService;
