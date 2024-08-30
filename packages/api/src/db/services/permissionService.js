const { pick } = require('lodash');
const { DatabaseAuth, AuthMask, DesensScanResult, DesensConfig, DesensType } = require('../models');

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

  async findDesenScan(db_id, db_name, table_name) {
    try {
      const scanList = await DesensScanResult.findAll({
        where: { db_id, db_name, table_name },
        include: {
          where: { status: 0 },
          model: DesensConfig,
          // required: true,
          attributes: ['id'],
          include: {
            where: { status: 0 },
            model: DesensType,
            required: true,
            attributes: ['desen_type_name', 'desen_type_code', 'remark', 'desen_char', 'desen_len', 'mask_type'],
          },
        },
      });
      if (!scanList) {
        return [];
      }
      return scanList?.map(p => {
        const desens = p.get({ plain: true });
        return {
          ...pick(desens, ['id', 'db_id', 'db_name', 'table_name', 'col_name', 'desen_id']),
          DesensType: desens.DesensConfig.DesensType,
        };
      });
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = PermissionService;
