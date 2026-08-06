/** @type {import('next').NextConfig} */
const path = require('path');
module.exports = {
  experimental: {
    turbopack: {
      root: path.resolve(__dirname, '..', '..')
    }
  }
};
