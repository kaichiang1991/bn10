const path = require("path");
const webpack = require("webpack")

module.exports = {
    
    entry: {
        app: "./src/main.ts",
    },
    output: {
        filename: "./[name].bundle.js",
        pathinfo: false

    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: ["ts-loader"]
            }
        ]
    },

    plugins: [
        // 全域變數
        new webpack.DefinePlugin({
            envGameServer: JSON.stringify(process.env.server),
            envPathPrefix: JSON.stringify(process.env.pathPrefix),
        }),
    ],
};