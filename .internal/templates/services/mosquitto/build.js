const ServiceBuilder = ({
  settings,
  version,
  logger
}) => {
  const path = require('path');
  const retr = {};
  const serviceName = 'mosquitto';

  const {
    setModifiedPorts,
    setLoggingState,
    setNetworkMode,
    setNetworks
  } = require('../../../src/utils/commonCompileLogic');

  const {
    checkPortConflicts,
    checkNetworkConflicts,
    checkDependencyServices
  } = require('../../../src/utils/commonBuildChecks');

  /*
    Order:
      1. compile() - merges build options into the final JSON output.
      2. issues()  - runs checks on the compile()'ed JSON, and can also test for errors.
      3. assume()  - sets required default values if they are not specified in compile(). Once defaults are set, it reruns compile(). This function is optional
      4. build()   - sets up scripts and files.
  */

  retr.init = () => {
    logger.debug(`ServiceBuilder:init() - '${serviceName}'`);
  };

  const checkServiceFilesCopied = () => {
    return `
if [[ ! -f ./services/mosquitto/mosquitto.conf ]]; then
  echo "Mosquitto config file is missing!"
  sleep 2
fi
`;
  };

  const createVolumesDirectory = () => {
    return `
mkdir -p ./volumes/mosquitto/data
mkdir -p ./volumes/mosquitto/pwfile
mkdir -p ./volumes/mosquitto/log
`;
  };

  const checkVolumesDirectory = () => {
    return `
HAS_ERROR="false"
if [[ ! -d ./volumes/mosquitto/data ]]; then
  echo "Mosquitto data directory is missing!"
  HAS_ERROR="true"
fi

if [[ ! -d ./volumes/mosquitto/pwfile ]]; then
  echo "Mosquitto pwfile directory is missing!"
  HAS_ERROR="true"
fi

if [[ ! -d ./volumes/mosquitto/log ]]; then
  echo "Mosquitto log directory is missing!"
  HAS_ERROR="true"
fi

if [[ "$HAS_ERROR" == "true ]]; then
  echo "Errors were detected when setting up Mosquitto"
  sleep 1
fi
`;
  };

  const setupVolumePermissions = (setUser1883) => {
    if (setUser1883) {
    return `
echo "Updating mosquitto permissions:"
echo "  chown -R 1883:1883 ./volumes/mosquitto/"
sudo chown -R 1883:1883 ./volumes/mosquitto/
    `;
    }
    return `
echo "Mosquitto volume permissions not changed."
    `;
  }

  retr.compile = ({
    outputTemplateJson,
    buildOptions,
  }) => {
    return new Promise((resolve, reject) => {
      try {
        console.info(`ServiceBuilder:compile() - '${serviceName}' started`);

        const compileResults = {
          modifiedPorts: setModifiedPorts({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedLogging: setLoggingState({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedNetworkMode: setNetworkMode({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedNetworks: setNetworks({ buildTemplate: outputTemplateJson, buildOptions, serviceName })
        };
        console.info(`ServiceBuilder:compile() - '${serviceName}' Results:`, compileResults);

        console.info(`ServiceBuilder:compile() - '${serviceName}' completed`);
        return resolve({ type: 'service' });
      } catch (err) {
        console.error(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ outputTemplateJson });
        console.debug({ buildOptions });
        return reject({
          component: `ServiceBuilder::compile() - '${serviceName}'`,
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.issues = ({
    outputTemplateJson,
    buildOptions,
    tmpPath
  }) => {
    return new Promise((resolve, reject) => {
      try {
        console.info(`ServiceBuilder:issues() - '${serviceName}' started`);
        let issues = [];

        const portConflicts = checkPortConflicts({ buildTemplate: outputTemplateJson, buildOptions, serviceName });
        issues = [...issues, ...portConflicts];

        const serviceDependencies = checkDependencyServices({ buildTemplate: outputTemplateJson, buildOptions, serviceName });
        issues = [...issues, ...serviceDependencies];

        const networkConflicts = checkNetworkConflicts({ buildTemplate: outputTemplateJson, buildOptions, serviceName });
        if (networkConflicts) {
          issues.push(networkConflicts);
        }

        console.info(`ServiceBuilder:issues() - '${serviceName}' Issues found: ${issues.length}`);
        console.info(`ServiceBuilder:issues() - '${serviceName}' completed`);
        return resolve(issues);
      } catch (err) {
        console.error(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ outputTemplateJson });
        console.debug({ buildOptions });
        console.debug({ tmpPath });
        return reject({
          component: `ServiceBuilder::issues() - '${serviceName}'`,
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.build = ({
    outputTemplateJson,
    buildOptions,
    tmpPath,
    zipList,
    prebuildScripts,
    postbuildScripts
  }) => {
    return new Promise((resolve, reject) => {
      try {
        console.info(`ServiceBuilder:build() - '${serviceName}' started`);
        const mosquittoConfFilePath = path.join(__dirname, settings.paths.serviceFiles, 'mosquitto.conf');
        zipList.push({
          fullPath: mosquittoConfFilePath,
          zipName: '/services/mosquitto/mosquitto.conf'
        });
        console.debug(`ServiceBuilder:build() - '${serviceName}' Added '${mosquittoConfFilePath}' to zip`);

        postbuildScripts.push({
          serviceName,
          comment: 'Ensure required service files exist for launch',
          multilineComment: null,
          code: checkServiceFilesCopied()
        });

        prebuildScripts.push({
          serviceName,
          comment: 'Create required service directory exists for first launch',
          multilineComment: null,
          code: createVolumesDirectory()
        });

        postbuildScripts.push({
          serviceName,
          comment: 'Ensure required service directory exists for launch',
          multilineComment: null,
          code: checkVolumesDirectory()
        });

        postbuildScripts.push({
          serviceName,
          comment: 'Setup correct permissions for volume',
          multilineComment: null,
          code: setupVolumePermissions(true)
        });

        console.info(`ServiceBuilder:build() - '${serviceName}' completed`);
        return resolve({ type: 'service' });
      } catch (err) {
        console.error(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ outputTemplateJson });
        console.debug({ buildOptions });
        console.debug({ tmpPath });
        return reject({
          component: `ServiceBuilder::build() - '${serviceName}'`,
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  return retr;
}

module.exports = ServiceBuilder;
