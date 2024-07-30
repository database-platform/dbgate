const express = require('express');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const http = require('http');
const cors = require('cors');
const getPort = require('get-port');
const path = require('path');

const useController = require('./utility/useController');
const socket = require('./utility/socket');

const connections = require('./controllers/connections');
const serverConnections = require('./controllers/serverConnections');
const databaseConnections = require('./controllers/databaseConnections');
const metadata = require('./controllers/metadata');
const sessions = require('./controllers/sessions');
const runners = require('./controllers/runners');
const jsldata = require('./controllers/jsldata');
const config = require('./controllers/config');
const archive = require('./controllers/archive');
const apps = require('./controllers/apps');
const auth = require('./controllers/auth');
const uploads = require('./controllers/uploads');
const plugins = require('./controllers/plugins');
const files = require('./controllers/files');
const scheduler = require('./controllers/scheduler');
const queryHistory = require('./controllers/queryHistory');

const onFinished = require('on-finished');

const onlineConnections = require('./onlineControllers/connections');
const onlineServerConnections = require('./onlineControllers/serverConnections');
const onlineDatabaseConnections = require('./onlineControllers/databaseConnections');
const onlineMetadata = require('./onlineControllers/metadata');
const onlineSessions = require('./onlineControllers/sessions');
const onlineRunners = require('./onlineControllers/runners');
const onlineJsldata = require('./onlineControllers/jsldata');
const onlineConfig = require('./onlineControllers/config');
const onlineArchive = require('./onlineControllers/archive');
const onlineApps = require('./onlineControllers/apps');
const onlineAuth = require('./onlineControllers/auth');
const onlineUploads = require('./onlineControllers/uploads');
const onlinePlugins = require('./onlineControllers/plugins');
const onlineFiles = require('./onlineControllers/files');
const onlineScheduler = require('./onlineControllers/scheduler');
const onlineQueryHistory = require('./onlineControllers/queryHistory');

const { rundir } = require('./utility/directories');
const platformInfo = require('./utility/platformInfo');
const getExpressPath = require('./utility/getExpressPath');
const { getLogins } = require('./utility/hasPermission');
const _ = require('lodash');
const { getLogger } = require('dbgate-tools');
// const requestIp = require('request-ip');

const logger = getLogger('main');

function start() {
  // logger.info(process.argv, 'process.argv');
  // logger.info(process.env, 'process.env');
  console.log('platformInfo: ', platformInfo);
  const app = express();

  app.set('trust proxy', true);
  const server = http.createServer(app);

  const logins = getLogins();
  if (logins && process.env.BASIC_AUTH) {
    app.use(
      basicAuth({
        users: _.fromPairs(logins.filter(x => x.password).map(x => [x.login, x.password])),
        challenge: true,
        realm: 'DbGate Web App',
      })
    );
  }
  // app.use(requestIp.mw());
  app.use(cors());

  if (platformInfo.isDocker) {
    // server static files inside docker container
    app.use(getExpressPath('/'), express.static('/home/dbgate-docker/public'));
  } else if (platformInfo.isNpmDist) {
    app.use(getExpressPath('/'), express.static(path.join(__dirname, '../../dbgate-web/public')));
  } else if (process.env.DEVWEB) {
    // console.log('__dirname', __dirname);
    // console.log(path.join(__dirname, '../../web/public/build'));
    app.use(getExpressPath('/'), express.static(path.join(__dirname, '../../web/public')));
  } else {
    app.get(getExpressPath('/'), (req, res) => {
      res.send('DbGate API');
    });
  }

  if (auth.shouldAuthorizeApi()) {
    app.use(auth.authMiddleware);
  }

  if (process.env.ENABLE_ONLINE === '1') {
    app.use(onlineAuth.authMiddleware);
  }

  app.get(getExpressPath('/stream'), async function (req, res) {
    const strmid = req.query.strmid;
    res.set({
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    });
    res.flushHeaders();

    // Tell the client to retry every 10 seconds if connectivity is lost
    res.write('retry: 10000\n\n');
    socket.addSseResponse(res, strmid);
    onFinished(req, () => {
      socket.removeSseResponse(strmid);
    });
  });

  app.use(bodyParser.json({ limit: '50mb' }));

  app.use(
    getExpressPath('/uploads'),
    fileUpload({
      limits: { fileSize: 4 * 1024 * 1024 },
    })
  );
  if (process.env.ENABLE_ONLINE === '1') {
    useOnlineAllControllers(app, null);
  } else {
    useAllControllers(app, null);
  }

  // if (process.env.PAGES_DIRECTORY) {
  //   app.use('/pages', express.static(process.env.PAGES_DIRECTORY));
  // }

  app.use(getExpressPath('/runners/data'), express.static(rundir()));

  if (platformInfo.isDocker) {
    const port = process.env.PORT || 3000;
    logger.info(`DbGate API listening on port ${port} (docker build)`);
    server.listen(port);
  } else if (platformInfo.isNpmDist) {
    getPort({
      port: parseInt(
        // @ts-ignore
        process.env.PORT || 3000
      ),
    }).then(port => {
      server.listen(port, () => {
        logger.info(`DbGate API listening on port ${port} (NPM build)`);
      });
    });
  } else if (process.env.DEVWEB) {
    const port = process.env.PORT || 3000;
    logger.info(`DbGate API & web listening on port ${port} (dev web build)`);
    server.listen(port);
  } else {
    const port = process.env.PORT || 3000;
    logger.info(`DbGate API listening on port ${port} (dev API build)`);
    server.listen(port);
  }

  function shutdown() {
    logger.info('\nShutting down DbGate API server');
    server.close(() => {
      logger.info('Server shut down, terminating');
      process.exit(0);
    });
    setTimeout(() => {
      logger.info('Server close timeout, terminating');
      process.exit(0);
    }, 1000);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGBREAK', shutdown);
}

function useOnlineAllControllers(app, electron) {
  useController(app, electron, '/connections', onlineConnections);
  useController(app, electron, '/server-connections', onlineServerConnections);
  useController(app, electron, '/database-connections', onlineDatabaseConnections);
  useController(app, electron, '/metadata', onlineMetadata);
  useController(app, electron, '/sessions', onlineSessions);
  useController(app, electron, '/runners', onlineRunners);
  useController(app, electron, '/jsldata', onlineJsldata);
  useController(app, electron, '/config', onlineConfig);
  useController(app, electron, '/archive', onlineArchive);
  useController(app, electron, '/uploads', onlineUploads);
  useController(app, electron, '/plugins', onlinePlugins);
  useController(app, electron, '/files', onlineFiles);
  useController(app, electron, '/scheduler', onlineScheduler);
  useController(app, electron, '/query-history', onlineQueryHistory);
  useController(app, electron, '/apps', onlineApps);
  useController(app, electron, '/auth', onlineAuth);
}

function useAllControllers(app, electron) {
  useController(app, electron, '/connections', connections);
  useController(app, electron, '/server-connections', serverConnections);
  useController(app, electron, '/database-connections', databaseConnections);
  useController(app, electron, '/metadata', metadata);
  useController(app, electron, '/sessions', sessions);
  useController(app, electron, '/runners', runners);
  useController(app, electron, '/jsldata', jsldata);
  useController(app, electron, '/config', config);
  useController(app, electron, '/archive', archive);
  useController(app, electron, '/uploads', uploads);
  useController(app, electron, '/plugins', plugins);
  useController(app, electron, '/files', files);
  useController(app, electron, '/scheduler', scheduler);
  useController(app, electron, '/query-history', queryHistory);
  useController(app, electron, '/apps', apps);
  useController(app, electron, '/auth', auth);
}

function setElectronSender(electronSender) {
  socket.setElectronSender(electronSender);
}

module.exports = { start, useAllControllers, useOnlineAllControllers, setElectronSender, configController: config };
