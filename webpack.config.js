const HtmlWebpackPlugin = require("html-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin")
const merge = require("webpack-merge")
const common = require("./webpack.common")
const {CleanWebpackPlugin} = require("clean-webpack-plugin")
const {BundleAnalyzerPlugin} = require("webpack-bundle-analyzer")

module.exports = merge(common, {
    mode: 'production',
    plugins: [
        new HtmlWebpackPlugin({
            filename: './index.html',
            template: 'template.cshtml',
            files: {
                js: ["../Entry/assets/js/jquery-3.4.1.min.js", "../Entry/assets/js/mobile-detect.min.js", "../Entry/assets/js/main.min.js"]
            },
            style: {
                css: ["../Entry/assets/css/main.min.css", "../Entry/assets/css/rotate.min.css"]
            }
        }),
        new CopyPlugin([
            { from: 'assets', to: './assets' },
            { from: 'config.json', to: './config.json'}
        ]),
        new CleanWebpackPlugin(),
        // new BundleAnalyzerPlugin()
    ],

    optimization: {
        splitChunks: {
            chunks: "initial"
        }
    }
})
