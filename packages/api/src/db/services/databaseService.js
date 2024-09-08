const { OrgGroup, Database, Group, DatabaseGroup } = require('../models');
const { getEngine } = require('../../utility/utils');

class OnlineDatabase {
  async findOrgGroup() {
    const orgGroups = await OrgGroup.findAll({
      where: { status: 0 },
      attributes: ['id', 'group_name', ['id', 'value'], ['group_name', 'label']],
    });
    return orgGroups?.map(p => p.get({ plain: true })) || [];
  }

  /**
   * 
   * _id(conid): `${username}_${groupId}_${db_id}`
   *
   * result:
   [
    {
        "server": "8.134.215.8",
        "engine": "mysql@dbgate-plugin-mysql",
        "port": 3306,
        "user": "smart",
        "password": "DR0kKY4inoKvDP91jrL+Gw==",
        "unsaved": false,
        "originId": 5,
        "_id": "admin_2_5",
        "displayName": "身份管理系统",
        "singleDatabase": true,
        "defaultDatabase": "platform",
        "permission": {
          
        }
    }
   ]
   **/
  async find(username, groupId, dbId, orgGroupId) {
    let dbWhere = { db_status: 0 };
    if (dbId) {
      // dbWhere.db_dbname = dbName;
      dbWhere.id = dbId;
    }
    if (orgGroupId) {
      dbWhere.group_id = orgGroupId;
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
                'group_id',
                'trino_flag',
                'trino_catalog',
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
          _id: `${username}_${groupId}_${item.id}`,
          displayName: item.db_name ?? item.db_ip,
          singleDatabase: item.db_dbname ? true : false,
          defaultDatabase: item.db_dbname ?? '',
          orgGroupId: item.group_id,
          trinoFlag: item.trino_flag === 1 ? true : false,
          trinoCatalog: item.trino_catalog,
        };
      });
      return acc.concat(databases);
    }, []);
  }

  /**
   * id: username_groupId_dbId
   * */
  async get(id) {
    const ids = id.split('_');
    const databases = await this.find(ids[0], ids[1], ids[2]);
    return databases[0];
  }
}

module.exports = OnlineDatabase;
