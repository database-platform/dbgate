const { Database, Group, DatabaseGroup } = require('../models');
const { getEngine } = require('../../utility/utils');

class OnlineDatabase {
  async find(username, groupId, dbId, dbName) {
    let dbWhere = {};
    if (dbId) {
      dbWhere.db_dbname = dbName;
      dbWhere.id = dbId;
    }
    const groups = await Group.findAll({
      where: { id: groupId },
      include: [
        {
          model: DatabaseGroup,
          include: [
            {
              where: dbWhere,
              model: Database,
              attributes: [
                'id',
                'db_name',
                'db_type',
                'db_name',
                'db_dbname',
                'db_ip',
                'db_port',
                'db_userId',
                'db_pwd',
                'db_owner',
                'db_status',
                'create_by',
                'create_time',
                'update_by',
                'update_time',
              ],
            },
          ],
          attributes: ['groupId'],
        },
      ],
      attributes: ['id'],
    });
    return groups.reduce((acc, group) => {
      const databasesOrigin = group.DatabaseGroups.map(dbGroup => dbGroup.Database);
      const databases = databasesOrigin.map(database => {
        const item = database.get({ plain: true });
        return {
          server: item.db_ip,
          engine: getEngine(item.db_type),
          port: item.db_port,
          user: item.db_userId,
          password: item.db_pwd,
          unsaved: false,
          originId: item.id,
          _id: `${username}_${groupId}_${item.id}_${item.db_dbname}`,
          displayName: item.db_name ?? item.db_dbname,
          singleDatabase: true,
          defaultDatabase: item.db_dbname,
        };
      });
      return acc.concat(databases);
    }, []);
  }

  /**
   * id: username_groupId_dbId_dbname
   * */
  async get(id) {
    const ids = id.split('_');
    const databases = await this.find(ids[0], ids[1], ids[2], ids[3]);
    return databases[0];
  }
}

module.exports = OnlineDatabase;
