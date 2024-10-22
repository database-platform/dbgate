const { filterName } = require('dbgate-tools');
const fs = require('fs');
const lineReader = require('line-reader');
const _ = require('lodash');
// const DatastoreProxy = require('../utility/DatastoreProxy');
const getJslFileName = require('../utility/getJslFileName');
const JsonLinesDatastore = require('../utility/JsonLinesDatastore');
const requirePluginFunction = require('../utility/requirePluginFunction');
const socket = require('../utility/socket');
const PermissionService = require('../db/services/permissionService');
const { processMask, processScanMask } = require('../utility/dataMask');

const permissionService = new PermissionService();

function readFirstLine(file) {
  return new Promise((resolve, reject) => {
    lineReader.open(file, (err, reader) => {
      if (err) {
        reject(err);
        return;
      }
      if (reader.hasNextLine()) {
        reader.nextLine((err, line) => {
          if (err) reject(err);
          resolve(line);
        });
      } else {
        resolve(null);
      }
    });
  });
}

module.exports = {
  datastores: {},

  async ensureDatastore(jslid, formatterFunction) {
    console.log('ensureDatastore ', jslid, formatterFunction);
    let datastore = this.datastores[jslid];
    if (!datastore || datastore.formatterFunction != formatterFunction) {
      if (datastore) {
        datastore._closeReader();
      }
      datastore = new JsonLinesDatastore(getJslFileName(jslid), formatterFunction);
      // datastore = new DatastoreProxy(getJslFileName(jslid));
      this.datastores[jslid] = datastore;
    }
    return datastore;
  },

  async closeDataStore(jslid) {
    console.log('closeDataStore ', jslid);
    const datastore = this.datastores[jslid];
    if (datastore) {
      await datastore._closeReader();
      delete this.datastores[jslid];
    }
  },

  getInfo_meta: true,
  async getInfo({ jslid }) {
    console.log('getInfo ', jslid);
    const file = getJslFileName(jslid);
    try {
      const firstLine = await readFirstLine(file);
      if (firstLine) {
        const parsed = JSON.parse(firstLine);
        if (parsed.__isStreamHeader) {
          return parsed;
        }
        return {
          __isStreamHeader: true,
          __isDynamicStructure: true,
        };
      }
      return null;
    } catch (err) {
      return null;
    }
  },

  getRows_meta: true,
  async getRows({ jslid, offset, limit, filters, sort, formatterFunction, conid, database }) {
    const datastore = await this.ensureDatastore(jslid, formatterFunction);
    console.log('getRows: ', jslid);
    const rows = await datastore.getRows(
      offset,
      limit,
      _.isEmpty(filters) ? null : filters,
      _.isEmpty(sort) ? null : sort
    );
    const info = await this.getInfo({ jslid });
    // console.log('get rows info: ', info);
    if (info.columns?.length !== 0) {
      const groups = _.groupBy(info.columns, 'table');
      // console.log('group2: ', groups);
      for (const table in groups) {
        console.log('group: ', table);

        const [, groupId, dbId] = conid.split('_');
        // console.log('groupId ', groupId, dbId);
        const desenScans = await permissionService.findDesenScan(dbId, database, table);
        console.log('get rows desen scan: ', desenScans?.length);
        desenScans?.map(scan => {
          processScanMask(scan.col_name, scan, rows);
        });

        const columnPermission = await permissionService.findColumn(groupId, dbId, database, table);
        console.log('get rows permission: ', columnPermission?.length);
        columnPermission.map(permission => {
          processMask(permission.tcolumn, permission.AuthMask, rows);
        });
      }
    }

    return rows;
  },

  exists_meta: true,
  async exists({ jslid }) {
    console.log('exists ', jslid);

    const fileName = getJslFileName(jslid);
    return fs.existsSync(fileName);
  },

  getStats_meta: true,
  getStats({ jslid }) {
    console.log('getStats ', jslid);

    const file = `${getJslFileName(jslid)}.stats`;
    if (fs.existsSync(file)) {
      try {
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
      } catch (e) {
        return {};
      }
    }
    return {};
  },

  loadFieldValues_meta: true,
  async loadFieldValues({ jslid, field, search, formatterFunction }) {
    console.log('loadFieldValues ', jslid);

    const datastore = await this.ensureDatastore(jslid, formatterFunction);
    const res = new Set();
    await datastore.enumRows(row => {
      if (!filterName(search, row[field])) return true;
      res.add(row[field]);
      return res.size < 100;
    });
    // @ts-ignore
    return [...res].map(value => ({ value }));
  },

  async notifyChangedStats(stats) {
    console.log('SENDING STATS', JSON.stringify(stats));
    const datastore = this.datastores[stats.jslid];
    if (datastore) await datastore.notifyChanged();
    socket.emit(`jsldata-stats-${stats.jslid}`, stats);

    // const readerInfo = this.openedReaders[stats.jslid];
    // if (readerInfo && readerInfo.isReading) {
    //   readerInfo.closeAfterReadAndSendStats = stats;
    // } else {
    //   await this.closeReader(stats.jslid);
    //   socket.emit(`jsldata-stats-${stats.jslid}`, stats);
    // }
  },

  saveText_meta: true,
  async saveText({ jslid, text }) {
    console.log('saveText ', jslid);

    await fs.promises.writeFile(getJslFileName(jslid), text);
    return true;
  },

  saveRows_meta: true,
  async saveRows({ jslid, rows }) {
    console.log('saveRows ', jslid);

    const fileStream = fs.createWriteStream(getJslFileName(jslid));
    for (const row of rows) {
      await fileStream.write(JSON.stringify(row) + '\n');
    }
    await fileStream.close();
    return true;
  },

  extractTimelineChart_meta: true,
  async extractTimelineChart({ jslid, timestampFunction, aggregateFunction, measures }) {
    console.log('extractTimelineChart ', jslid);

    const timestamp = requirePluginFunction(timestampFunction);
    const aggregate = requirePluginFunction(aggregateFunction);
    const datastore = new JsonLinesDatastore(getJslFileName(jslid));
    let mints = null;
    let maxts = null;
    // pass 1 - counts stats, time range
    await datastore.enumRows(row => {
      const ts = timestamp(row);
      if (!mints || ts < mints) mints = ts;
      if (!maxts || ts > maxts) maxts = ts;
      return true;
    });
    const minTime = new Date(mints).getTime();
    const maxTime = new Date(maxts).getTime();
    const duration = maxTime - minTime;
    const STEPS = 100;
    let stepCount = duration > 100 * 1000 ? STEPS : Math.round((maxTime - minTime) / 1000);
    if (stepCount < 2) {
      stepCount = 2;
    }
    const stepDuration = duration / stepCount;
    const labels = _.range(stepCount).map(i => new Date(minTime + stepDuration / 2 + stepDuration * i));

    // const datasets = measures.map(m => ({
    //   label: m.label,
    //   data: Array(stepCount).fill(0),
    // }));

    const mproc = measures.map(m => ({
      ...m,
    }));

    const data = Array(stepCount)
      .fill(0)
      .map(() => ({}));

    // pass 2 - count measures
    await datastore.enumRows(row => {
      const ts = timestamp(row);
      let part = Math.round((new Date(ts).getTime() - minTime) / stepDuration);
      if (part < 0) part = 0;
      if (part >= stepCount) part - stepCount - 1;
      if (data[part]) {
        data[part] = aggregate(data[part], row, stepDuration);
      }
      return true;
    });

    datastore._closeReader();

    // const measureByField = _.fromPairs(measures.map((m, i) => [m.field, i]));

    // for (let mindex = 0; mindex < measures.length; mindex++) {
    //   for (let stepIndex = 0; stepIndex < stepCount; stepIndex++) {
    //     const measure = measures[mindex];
    //     if (measure.perSecond) {
    //       datasets[mindex].data[stepIndex] /= stepDuration / 1000;
    //     }
    //     if (measure.perField) {
    //       datasets[mindex].data[stepIndex] /= datasets[measureByField[measure.perField]].data[stepIndex];
    //     }
    //   }
    // }

    // for (let i = 0; i < measures.length; i++) {
    //   if (measures[i].hidden) {
    //     datasets[i] = null;
    //   }
    // }

    return {
      labels,
      datasets: mproc.map(m => ({
        label: m.label,
        data: data.map(d => d[m.field] || 0),
      })),
    };
  },
};
