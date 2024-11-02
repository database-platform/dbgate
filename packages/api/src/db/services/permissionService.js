const { pick, isArray } = require('lodash');
const { DatabaseAuth, AuthMask, DesensScanResult, DesensConfig, DesensType } = require('../models');
const { getLogger } = global.DBGATE_TOOLS;
const { Op } = require('sequelize');

const logger = getLogger('permissionService');

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

  async findColumnDataMask(group_id, db_id, schema, tnames) {
    return this.find({ group_id, db_id, schema, tname: { [Op.in]: tnames }, type: 'column' });
  }

  async find(where) {
    // logger.info({ where }, 'find where: ');
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
      logger.error({ error }, 'find: ');
      return [];
    }
  }

  async findDesenScan(db_id, db_name, table_names) {
    if (!isArray(table_names)) {
      table_names = [table_names];
    }
    logger.info({ db_id, db_name, table_names }, 'findDesenScan: ');
    try {
      const scanList = await DesensScanResult.findAll({
        where: { db_id, db_name, table_name: { [Op.in]: table_names } },
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
        desens.type = 0; // buildin
        return {
          ...pick(desens, ['id', 'db_id', 'db_name', 'table_name', 'col_name', 'desen_id', 'type']),
          DesensType: desens.DesensConfig.DesensType,
        };
      });
    } catch (error) {
      logger.error({ error: error.message }, 'findDesenScan: ');
      return [];
    }
  }
}

module.exports = PermissionService;
