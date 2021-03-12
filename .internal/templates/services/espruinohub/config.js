const espruinohub = () => {
  const retr = {};

  const serviceName = 'espruinohub';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      volumes: false,
      networks: false,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      website: '', // Website of service
      rawMarkdownRemote: '', // Usually links to github raw help pages.
      rawMarkdownLocal: '', // Relative path to docs locally
      onlineRendered: '' // Usually links to the github page for this service.
    };
  };

  retr.getCommands = () => {
    return {
      commands: {} // Key/value pair of helper commands user can run locally
    };
  };

  retr.getMeta = () => {
    return {
      serviceName, // Required
      displayName: 'EspruinoHub (untested)',
      serviceTypeTags: ['mqtt', 'ble', 'rpi only']
    };
  };

  return retr;
};

module.exports = espruinohub;
