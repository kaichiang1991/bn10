const path = require("path");
const merge = require("webpack-merge")
const common = require("./webpack.common")

module.exports = merge(common, {
    mode: "development",
    devtool: "cheap-module-eval-source-map",
    watchOptions: {
        ignored: ['files/**/*.js', 'node_modules/**'],
        aggregateTimeout: 1000
    }

})
