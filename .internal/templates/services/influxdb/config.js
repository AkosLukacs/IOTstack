const influxDb = () => {
  const retr = {};

  const serviceName = 'influxdb';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "8086:8086": 'http'
      },
      modifyableEnvironment: [
        {
          key: 'INFLUXDB_UDP_BIND_ADDRESS',
          value: '0.0.0.0:8086'
        }
      ],
      volumes: true,
      imageTags: ['1.8.4', 'latest'],
      networks: true,
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
      displayName: 'InfluxDB',
      serviceTypeTags: ['database', 'timeseries', 'sql'],
      iconUri: '/logos/influxdb.svg'
    };
  };

  return retr;
};

module.exports = influxDb;
