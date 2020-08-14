const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin")
const merge = require("webpack-merge")
const common = require("./webpack.common")
const {CleanWebpackPlugin} = require("clean-webpack-plugin")
const {BundleAnalyzerPlugin} = require("webpack-bundle-analyzer")
const path = require('path')

module.exports = merge(common, {
    mode: 'development',
    plugins: [
        new HtmlWebpackPlugin({
            filename: './index.html',
            template: 'template.cshtml',
            files: {
                js: ['http://172.105.114.236:3000/test/Entry/assets/js/jquery-3.4.1.min.js', "http://172.105.114.236:3000/test/Entry/assets/js/mobile-detect.min.js", "http://172.105.114.236:3000/test/Entry/assets/js/main.min.js"]
            },
            style: {
                css: ["http://172.105.114.236:3000/test/Entry/assets/css/main.min.css", "http://172.105.114.236:3000/test/Entry/assets/css/rotate.min.css"]
            }
        }),
        new CopyPlugin([
            { from: 'assets', to: './assets' },
            { from: 'config.json', to: './config.json'},
        ])
    ]
})
