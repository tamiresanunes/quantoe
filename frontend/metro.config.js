const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Keep filesystem concurrency predictable on Windows development machines.
config.maxWorkers = 2;

module.exports = config;
