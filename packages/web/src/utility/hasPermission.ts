import { compilePermissions, testPermission } from 'dbgate-tools';
import { useConfig } from './metadataLoaders';

let compiled = null;

export default function hasPermission(tested) {
  return testPermission(tested, compiled);
}

export const PERMISSION = {
  DQL: 'dql',
  DML: 'dml',
  DCL: 'dcl',
  DDL: 'ddl',
  DQL_EXPORT: 'dql_export',
  DML_INSERT: 'dml_insert',
  DML_UPDATE: 'dml_update',
  DML_DELETE: 'dml_delete',
  DDL_CREATE_DB: 'ddl_create_db',
  DDL_DROP_DB: 'ddl_drop_db',
  DDL_ALTER_DB: 'ddl_alter_db',
  DDL_CREATE: 'ddl_create',
  DDL_DROP: 'ddl_drop',
  DDL_ALTER: 'ddl_alter',
  DDL_RENAME: 'ddl_rename',
  DDL_TRUNCATE: 'ddl_truncate',
  DCL_GRANT_REVOKE: 'dcl_grant_revoke',
  DCL_CREATE_USER: 'dcl_create_user',
};
/**
  *{
            "id": 98,
            "group_id": "1",
            "db_id": "12",
            "db_type": "mysql",
            "owner": "*",
            "schema": "smartdata",
            "tname": "*",
            "tcolumn": "*",
            "type": "database",
            "type_opts": null,
            "dql": 1,
            "dml": 0,
            "dcl": 0,
            "ddl": 0,
            "tty": 0,
            "hidden": 0,
            "dql_export": 0,
            "dml_insert": 0,
            "dml_update": 0,
            "dml_delete": 0,
            "ddl_create_db": 0,
            "ddl_drop_db": 0,
            "ddl_alter_db": 0,
            "ddl_create": 0,
            "ddl_drop": 0,
            "ddl_alter": 0,
            "ddl_rename": 0,
            "ddl_truncate": 0,
            "dcl_grant_revoke": 0,
            "dcl_create_user": 0,
            "maskId": null,
            "create_by": null,
            "create_time": "2024-08-09T16:04:47.000Z",
            "update_by": null,
            "update_time": null,
            "AuthMask": null
        }
  **/
export function hasDataPermission(permission, level1, level2) {
  if (!permission) {
    return false;
  }
  return permission[level1] === 1 && permission[level2] === 1;
}

export function subscribePermissionCompiler() {
  useConfig().subscribe(value => {
    if (!value) return;
    const { permissions } = value;
    compiled = compilePermissions(permissions);
  });
}
